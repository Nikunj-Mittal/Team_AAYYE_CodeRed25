from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db, Quiz, Question, Option, QuizAttempt
import os

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
        quizzes = Quiz.query.all()
        return jsonify([{
            'id': quiz.id,
            'title': quiz.title,
            'created_at': quiz.created_at
        } for quiz in quizzes])
    except Exception as e:
        return jsonify({'error': 'Failed to fetch quizzes'}), 500

@app.route('/api/quiz/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    try:
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
        
        return jsonify({
            'id': quiz.id,
            'title': quiz.title,
            'questions': questions
        })
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
            
            if answer['selected_option_id'] == correct_option.id:
                score += 1
        
        attempt = QuizAttempt(quiz_id=quiz_id, score=score)
        db.session.add(attempt)
        db.session.commit()
        
        return jsonify({
            'score': score,
            'total': total_questions,
            'percentage': (score/total_questions) * 100
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit quiz attempt'}), 500

if __name__ == '__main__':
    app.run(debug=True)