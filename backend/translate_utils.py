from typing import Dict, List, Optional
import boto3
from botocore.exceptions import ClientError
from config import AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY, SUPPORTED_LANGUAGES

# Create a global instance of TranslationService
_translation_service = None

def get_translation_service():
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService()
    return _translation_service

def translate_text(text: str, target_lang: str) -> str:
    """Wrapper function for translation service"""
    service = get_translation_service()
    return service._translate_text(text, target_lang)

def translate_quiz_data(quiz_data: Dict, target_lang: str) -> Dict:
    """Wrapper function for quiz translation"""
    service = get_translation_service()
    return service.translate_quiz(quiz_data, target_lang)

class TranslationService:
    def __init__(self):
        """Initialize the AWS Translate client"""
        self.client = boto3.client('translate',
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY
        )

    def translate_quiz(self, quiz_data: Dict, target_lang: str) -> Dict:
        if target_lang not in SUPPORTED_LANGUAGES or target_lang == 'en':
            return quiz_data

        translated_data = quiz_data.copy()
        
        # Translate quiz title
        if 'title' in translated_data:
            translated_data['title'] = self._translate_text(translated_data['title'], target_lang)
        
        # Translate questions and options
        if 'questions' in translated_data:
            for question in translated_data['questions']:
                if 'question' in question:
                    question['question'] = self._translate_text(question['question'], target_lang)
                for option in question.get('options', []):
                    if 'text' in option:
                        option['text'] = self._translate_text(option['text'], target_lang)
        
        return translated_data

    def _translate_text(self, text: str, target_lang: str) -> str:
        if not text or target_lang == 'en':
            return text
            
        try:
            response = self.client.translate_text(
                Text=text,
                SourceLanguageCode='en',
                TargetLanguageCode=target_lang
            )
            return response['TranslatedText']
        except Exception as e:
            print(f"Translation error: {e}")
            return text

    @staticmethod
    def get_supported_languages() -> Dict[str, str]:
        """
        Get dictionary of supported language codes and names
        
        Returns:
            Dict[str, str]: Dictionary of language codes and names
        """
        return SUPPORTED_LANGUAGES

    def detect_language(self, text: str) -> Optional[str]:
        """
        Detect the language of a text using Amazon Comprehend
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Optional[str]: Detected language code or None if detection fails
        """
        try:
            comprehend = boto3.client('comprehend',
                region_name=AWS_REGION,
                aws_access_key_id=AWS_ACCESS_KEY,
                aws_secret_access_key=AWS_SECRET_KEY
            )
            response = comprehend.detect_dominant_language(Text=text)
            languages = response['Languages']
            if languages:
                return languages[0]['LanguageCode']
            return None
        except Exception as e:
            print(f"Language detection error: {e}")
            return None 