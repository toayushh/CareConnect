import os
import google.generativeai as genai
from typing import Dict, List, Optional
import json
from datetime import datetime

class GeminiChatbotService:
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            # For demo purposes, we'll use a placeholder
            print("Warning: GEMINI_API_KEY not found in environment variables")
            print("Please set your Gemini API key in environment variables or config")
            
        if api_key and api_key != 'your_gemini_api_key_here':
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            
        # Healthcare-specific system prompt
        self.system_prompt = """
        You are HealthBot, an AI assistant for the LeapFrog Healthcare Platform. You are designed to help patients and healthcare providers with health-related questions and guidance.

        IMPORTANT GUIDELINES:
        1. You are NOT a replacement for professional medical advice, diagnosis, or treatment
        2. Always encourage users to consult with healthcare professionals for medical concerns
        3. Provide general health information, wellness tips, and educational content
        4. Be empathetic, supportive, and professional
        5. If asked about specific medical conditions, provide general information but emphasize consulting a doctor
        6. Help with understanding medical terms, procedures, and general health concepts
        7. Assist with healthy lifestyle recommendations (diet, exercise, stress management)
        8. If given patient data context, use it to provide more personalized (but still general) guidance

        MEDICAL DISCLAIMER: Always include appropriate medical disclaimers when providing health information.

        Respond in a friendly, professional, and helpful manner. Keep responses concise but informative.
        """

    def get_health_context(self, patient_data: Optional[Dict] = None) -> str:
        """Generate context from patient health data for more personalized responses"""
        if not patient_data:
            return ""
        
        context_parts = []
        
        # Add basic patient info
        if patient_data.get('age'):
            context_parts.append(f"Patient age: {patient_data['age']}")
        
        # Add health conditions
        if patient_data.get('conditions'):
            conditions = [cond.get('name', '') for cond in patient_data['conditions']]
            if conditions:
                context_parts.append(f"Medical conditions: {', '.join(conditions)}")
        
        # Add current medications
        if patient_data.get('medications'):
            active_meds = [med.get('name', '') for med in patient_data['medications'] 
                          if med.get('status') == 'Active']
            if active_meds:
                context_parts.append(f"Current medications: {', '.join(active_meds)}")
        
        # Add recent vital signs
        if patient_data.get('latest_vitals'):
            vitals = patient_data['latest_vitals']
            vital_info = []
            if vitals.get('blood_pressure'):
                vital_info.append(f"BP: {vitals['blood_pressure']}")
            if vitals.get('heart_rate'):
                vital_info.append(f"HR: {vitals['heart_rate']}")
            if vitals.get('weight'):
                vital_info.append(f"Weight: {vitals['weight']}")
            if vital_info:
                context_parts.append(f"Recent vitals: {', '.join(vital_info)}")
        
        # Add health scores
        if patient_data.get('health_scores'):
            scores = patient_data['health_scores']
            if scores.get('overall_health_score'):
                context_parts.append(f"Overall health score: {scores['overall_health_score']}/100")
        
        if context_parts:
            return f"\n\nPATIENT CONTEXT (for personalized guidance only):\n{'; '.join(context_parts)}"
        return ""

    async def get_response(self, message: str, patient_data: Optional[Dict] = None, 
                          conversation_history: List[Dict] = None) -> Dict:
        """Get response from Gemini AI with health context"""
        
        try:
            if not self.model:
                # Return a helpful fallback response when API key is not configured
                return self._get_fallback_response(message)
            
            # Build the full prompt with context
            health_context = self.get_health_context(patient_data)
            
            # Build conversation history
            conversation_context = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    role = "User" if msg.get('role') == 'user' else "HealthBot"
                    conversation_context += f"\n{role}: {msg.get('content', '')}"
            
            # Construct the full prompt
            full_prompt = f"""
            {self.system_prompt}
            {health_context}
            
            CONVERSATION HISTORY:{conversation_context}
            
            USER'S CURRENT MESSAGE: {message}
            
            Please provide a helpful, professional response. Remember to include medical disclaimers when appropriate.
            """
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            if response and response.text:
                return {
                    "response": response.text.strip(),
                    "status": "success",
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "gemini-pro"
                }
            else:
                return self._get_fallback_response(message)
                
        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            return self._get_fallback_response(message, error=True)

    def _get_fallback_response(self, message: str, error: bool = False) -> Dict:
        """Provide fallback responses when Gemini API is not available"""
        
        message_lower = message.lower()
        
        # Health-related keywords and responses
        responses = {
            "appointment": "I can help you with appointment-related questions! You can book appointments through the 'Find Doctors' section in your dashboard. If you need to reschedule or cancel, check your 'My Appointments' page.",
            
            "medication": "For medication questions, I recommend consulting with your doctor or pharmacist. You can view your current medications in the 'Medical Records' section. Always follow your healthcare provider's instructions for taking medications.",
            
            "symptoms": "If you're experiencing symptoms, it's important to track them using our Progress Tracking feature. For concerning symptoms, please contact your healthcare provider promptly. Emergency symptoms require immediate medical attention - call emergency services if needed.",
            
            "health score": "Your health score is calculated based on various factors including mood, activity levels, and vital signs. You can view your detailed health score in the Health Dashboard. To improve your score, focus on regular exercise, good sleep, and stress management.",
            
            "lab results": "Lab results can be found in your Medical Records section under 'Lab Results'. For interpretation of results, please discuss them with your healthcare provider who can explain what they mean for your specific health situation.",
            
            "pain": "For pain management, please consult your healthcare provider. In the meantime, you can track your pain levels using our Progress Tracking feature to help your doctor understand patterns and triggers.",
            
            "diet": "A balanced diet is important for overall health. Consider consulting with a registered dietitian for personalized nutrition advice. You can track your eating habits and water intake in the Progress section.",
            
            "exercise": "Regular physical activity is great for health! Start slowly and gradually increase intensity. Track your activities in the Progress section. Always consult your doctor before starting a new exercise program, especially if you have health conditions."
        }
        
        # Find the best matching response
        for keyword, response in responses.items():
            if keyword in message_lower:
                disclaimer = "\n\n⚠️ Medical Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with your healthcare provider for medical concerns."
                return {
                    "response": response + disclaimer,
                    "status": "success" if not error else "fallback",
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "fallback_system"
                }
        
        # Default response
        default_response = """
        Hello! I'm HealthBot, your AI health assistant. I can help you with:
        
        • General health information and wellness tips
        • Understanding medical terms and procedures
        • Navigating the LeapFrog Healthcare Platform
        • Appointment and medication reminders
        • Healthy lifestyle recommendations
        
        How can I assist you today? Remember, I'm here to provide general information and support, but always consult with your healthcare provider for medical advice.
        
        ⚠️ Medical Disclaimer: I am not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        """
        
        error_note = "\n\n🔧 Note: AI service is currently using fallback responses. For full AI capabilities, please contact your system administrator." if error else ""
        
        return {
            "response": default_response.strip() + error_note,
            "status": "success" if not error else "fallback",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "fallback_system"
        }

    def get_health_tips(self, category: str = "general") -> Dict:
        """Get health tips by category"""
        tips = {
            "general": [
                "Stay hydrated by drinking at least 8 glasses of water daily",
                "Aim for 7-9 hours of quality sleep each night",
                "Incorporate 30 minutes of physical activity into your daily routine",
                "Eat a balanced diet rich in fruits, vegetables, and whole grains",
                "Practice stress management techniques like deep breathing or meditation"
            ],
            "heart": [
                "Monitor your blood pressure regularly",
                "Limit sodium intake to less than 2,300mg per day",
                "Include omega-3 rich foods like fish in your diet",
                "Avoid smoking and limit alcohol consumption",
                "Maintain a healthy weight for your body type"
            ],
            "diabetes": [
                "Monitor blood glucose levels as recommended by your doctor",
                "Count carbohydrates and maintain consistent meal timing",
                "Stay physically active to help manage blood sugar",
                "Take medications as prescribed by your healthcare provider",
                "Keep your feet healthy with daily inspection and proper care"
            ],
            "mental": [
                "Practice mindfulness and relaxation techniques",
                "Maintain social connections with friends and family",
                "Set realistic goals and celebrate small achievements",
                "Get regular sunlight exposure or consider vitamin D supplements",
                "Don't hesitate to seek professional help when needed"
            ]
        }
        
        return {
            "tips": tips.get(category, tips["general"]),
            "category": category,
            "timestamp": datetime.utcnow().isoformat(),
            "disclaimer": "These are general wellness tips. Always consult your healthcare provider for personalized medical advice."
        }
