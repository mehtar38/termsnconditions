import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-2.5-pro')

prompt = "Explain how neural networks work in simple terms."

response = model.generate_content(prompt)

print(response.text)