# app.py

import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="Gemini Code Improver", layout="centered")
st.title("💡 Gemini Code Improver")

st.markdown("Paste your code below and get a better version using Google's Gemini Pro model.")

# Get API key from user
api_key = st.text_input("🔐 Enter your Gemini API Key", type="password")

# Code input
code_input = st.text_area("📄 Paste your code here", height=300)

# Improve button
if st.button("✨ Improve Code"):
    if not api_key or not code_input:
        st.warning("Please enter both the code and the API key.")
    else:
        try:
            # Initialize Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")

            # Prompt
            prompt = f"Improve this code:\n\n{code_input}"

            with st.spinner("Gemini is improving your code..."):
                response = model.generate_content(prompt)
                improved_code = response.text

            st.success("Code improved successfully! ✅")
            st.code(improved_code, language="python")

        except Exception as e:
            st.error(f"❌ Error: {str(e)}")
