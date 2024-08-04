from google.cloud import secretmanager
from functions_framework import http
import os
import google.generativeai as genai
import tempfile


@http
def image_processing(request):
    """
    Receives a PNG/JPEG image file, processes it with Vision API,
    extracts product names, and gets sustainable alternatives from Gemini.
    """
    try:
        if not request.files or 'image' not in request.files:
            raise ValueError("Missing image file in request")
        image_file = request.files['image']

        allowed_content_types = ['image/png', 'image/jpeg']
        if image_file.content_type not in allowed_content_types:
            raise ValueError(f"Unsupported image format. Allowed formats: {', '.join(allowed_content_types)}")

        image_data = image_file.read()

        with tempfile.NamedTemporaryFile(suffix='.png') as temp_file:  
            temp_file.write(image_data)  
            temp_file.flush() 
            

            secret_client = secretmanager.SecretManagerServiceClient()
            secret_name = f"projects/{os.environ['GCP_PROJECT']}/secrets/gemini_api_key/versions/latest"
            secret_response = secret_client.access_secret_version(request={"name": secret_name})
            api_key = secret_response.payload.data.decode("UTF-8")

            genai.configure(api_key=api_key)

            product_image = genai.upload_file(
                temp_file.name, name="sustainable-product"
            )

            model = genai.GenerativeModel(model_name="gemini-1.5-pro-latest")

            gemini_instructions = "Provide sustainable alternatives for the following products in the image."
            response = model.generate_content([product_image, gemini_instructions])
            gemini_text_response = response.text

            print(f"Gemini response: {gemini_text_response}")


            return {"gemini_text_response": gemini_text_response}, 200
    except (ValueError, Exception) as e:
        print(f"Error in image_processing: {e}")
        return {"error": str(e)}, 500

