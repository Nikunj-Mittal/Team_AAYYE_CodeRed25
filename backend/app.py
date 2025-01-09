from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db, Quiz, Question, Option, QuizAttempt, QuizAnswer
from translate_utils import translate_quiz_data, translate_text
import os
import requests
import uuid
import boto3
from botocore.exceptions import ClientError
from config import AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY, SUPPORTED_LANGUAGES

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Quiz API is running"})

@app.route('/api/create_quiz', methods=['POST'])
def create_quiz():
    try:
        data = request.get_json()
        if not data or 'title' not in data or 'questions' not in data:
            return jsonify({'error': 'Invalid request data'}), 400

        # Create and commit the quiz first
        new_quiz = Quiz(title=data['title'])
        db.session.add(new_quiz)
        db.session.commit()
        
        # Create and commit each question
        for q_data in data['questions']:
            if 'question' not in q_data or 'options' not in q_data:
                raise ValueError('Invalid question format')

            question = Question(quiz_id=new_quiz.id, question_text=q_data['question'])
            db.session.add(question)
            db.session.commit()  # Commit to get question.id
            
            # Validate that at least one option is marked as correct
            has_correct_answer = False
            for opt_data in q_data['options']:
                if 'text' not in opt_data or 'isCorrect' not in opt_data:
                    raise ValueError('Invalid option format')
                if opt_data['isCorrect']:
                    has_correct_answer = True
                
                option = Option(
                    question_id=question.id,
                    option_text=opt_data['text'],
                    is_correct=opt_data['isCorrect']
                )
                db.session.add(option)
            
            if not has_correct_answer:
                raise ValueError('Each question must have at least one correct answer')
            
        # Final commit for all options
        db.session.commit()
        return jsonify({'message': 'Quiz created successfully', 'quiz_id': new_quiz.id})
    
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred while creating the quiz'}), 500

@app.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    try:
        target_language = request.args.get('lang', 'en')
        quizzes = Quiz.query.all()
        quiz_list = [{
            'id': quiz.id,
            'title': quiz.title,
            'created_at': quiz.created_at
        } for quiz in quizzes]
        
        # Translate titles if a target language is specified
        if target_language != 'en':
            for quiz in quiz_list:
                quiz['title'] = translate_text(quiz['title'], target_language)
                
        return jsonify(quiz_list)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch quizzes'}), 500

@app.route('/api/quiz/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    try:
        target_language = request.args.get('lang', 'en')
        quiz = Quiz.query.get_or_404(quiz_id)
        questions = []
        
        for question in quiz.questions:
            options = [{
                'id': opt.id,
                'text': opt.option_text,
                'isCorrect': opt.is_correct if request.args.get('showAnswers') == 'true' else None
            } for opt in question.options]
            
            questions.append({
                'id': question.id,
                'question': question.question_text,
                'options': options
            })
        
        quiz_data = {
            'id': quiz.id,
            'title': quiz.title,
            'questions': questions
        }
        
        # Translate the quiz data if a target language is specified
        translated_data = translate_quiz_data(quiz_data, target_language)
        return jsonify(translated_data)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch quiz'}), 500

@app.route('/api/quiz/attempt', methods=['POST'])
def submit_attempt():
    try:
        data = request.get_json()
        if not data or 'quiz_id' not in data or 'answers' not in data:
            return jsonify({'error': 'Invalid request data'}), 400

        quiz_id = data['quiz_id']
        answers = data['answers']
        
        quiz = Quiz.query.get_or_404(quiz_id)
        score = 0
        total_questions = len(quiz.questions)
        
        if not answers or len(answers) != total_questions:
            return jsonify({'error': 'All questions must be answered'}), 400

        # Create the attempt first
        attempt = QuizAttempt(quiz_id=quiz_id, score=0)
        db.session.add(attempt)
        db.session.flush()  # Get the attempt ID

        for answer in answers:
            if 'question_id' not in answer or 'selected_option_id' not in answer:
                return jsonify({'error': 'Invalid answer format'}), 400

            question = Question.query.get(answer['question_id'])
            if not question or question.quiz_id != quiz_id:
                return jsonify({'error': 'Invalid question ID'}), 400

            correct_option = Option.query.filter_by(
                question_id=question.id,
                is_correct=True
            ).first()
            
            # Store the answer
            quiz_answer = QuizAnswer(
                attempt_id=attempt.id,
                question_id=question['question_id'],
                selected_option_id=answer['selected_option_id']
            )
            db.session.add(quiz_answer)
            
            if answer['selected_option_id'] == correct_option.id:
                score += 1
        
        # Update the attempt score
        attempt.score = score
        db.session.commit()
        
        return jsonify({
            'score': score,
            'total': total_questions,
            'percentage': (score/total_questions) * 100
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit quiz attempt'}), 500

@app.route('/api/quiz/<int:quiz_id>/stats', methods=['GET'])
def get_quiz_stats(quiz_id):
    try:
        quiz = Quiz.query.get_or_404(quiz_id)
        attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id).all()
        
        if not attempts:
            return jsonify({
                'totalAttempts': 0,
                'averageScore': 0,
                'highestScore': 0,
                'passRate': 0,
                'scoreDistribution': [0, 0, 0, 0, 0],
                'attemptDates': [],
                'attemptsPerDay': [],
                'questionSuccessRates': [],
                'questionNumbers': [],
                'questionDetails': []
            })

        # Calculate basic statistics
        total_attempts = len(attempts)
        total_questions = len(quiz.questions)
        scores = [attempt.score / total_questions for attempt in attempts]  # Convert to percentage
        avg_score = sum(scores) / total_attempts * 100
        highest_score = max(scores) * 100
        pass_rate = len([s for s in scores if s >= 0.6]) / total_attempts * 100

        # Calculate score distribution
        score_ranges = [0] * 5
        for score in scores:
            index = min(int(score * 5), 4)
            score_ranges[index] += 1

        # Calculate attempts over time
        from collections import defaultdict
        from datetime import datetime, timedelta
        
        attempt_dates = defaultdict(int)
        for attempt in attempts:
            date_str = attempt.created_at.strftime('%Y-%m-%d')
            attempt_dates[date_str] += 1

        # Sort dates and get last 7 days
        sorted_dates = sorted(attempt_dates.items())[-7:]
        dates = [date for date, _ in sorted_dates]
        daily_attempts = [count for _, count in sorted_dates]

        # Calculate per-question statistics
        question_stats = []
        for question in quiz.questions:
            correct_answers = 0
            wrong_answers = defaultdict(int)
            
            # Get all answers for this question
            answers = QuizAnswer.query.filter_by(question_id=question.id).all()
            total_answers = len(answers)
            
            if total_answers > 0:
                for answer in answers:
                    if answer.selected_option_id == Option.query.filter_by(
                        question_id=question.id,
                        is_correct=True
                    ).first().id:
                        correct_answers += 1
                    else:
                        selected_text = Option.query.get(answer.selected_option_id).option_text
                        wrong_answers[selected_text] += 1

                success_rate = (correct_answers / total_answers) * 100
                common_wrong = max(wrong_answers.items(), key=lambda x: x[1])[0] if wrong_answers else "N/A"
            else:
                success_rate = 0
                common_wrong = "N/A"
            
            question_stats.append({
                'question': question.question_text[:50] + "...",
                'successRate': success_rate,
                'commonWrongAnswer': common_wrong
            })

        return jsonify({
            'totalAttempts': total_attempts,
            'averageScore': avg_score,
            'highestScore': highest_score,
            'passRate': pass_rate,
            'scoreDistribution': score_ranges,
            'attemptDates': dates,
            'attemptsPerDay': daily_attempts,
            'questionSuccessRates': [stat['successRate'] for stat in question_stats],
            'questionNumbers': [f"Q{i}" for i in range(1, len(quiz.questions) + 1)],
            'questionDetails': question_stats
        })

    except Exception as e:
        print(f"Error in get_quiz_stats: {str(e)}")  # Add logging
        return jsonify({'error': 'Failed to fetch quiz statistics'}), 500

def get_supported_languages():
    """Return dictionary of supported languages"""
    return SUPPORTED_LANGUAGES

def translate_text(text, target_lang):
    """
    Translate text using Amazon Translate
    
    Args:
        text (str): Text to translate
        target_lang (str): Target language code
        
    Returns:
        str: Translated text or original text if translation fails
    """
    if target_lang not in SUPPORTED_LANGUAGES:
        print(f"Unsupported language code: {target_lang}")
        return text
        
    try:
        translate_client = boto3.client('translate',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY
        )
        
        response = translate_client.translate_text(
            Text=text,
            SourceLanguageCode='en',  # Source language is English
            TargetLanguageCode=target_lang
        )
        
        return response['TranslatedText']
        
    except ClientError as e:
        print(f"AWS Translation error: {e}")
        return text
    except Exception as e:
        print(f"Unexpected error during translation: {e}")
        return text

if __name__ == '__main__':
    app.run(debug=True)