import code
import requests
import base64
from PIL import Image
from io import BytesIO
import matplotlib.pyplot as plt

sd_backend_url = "http://localhost:7860"


'''
Function to generate an image using the Stable Diffusion API. When transparent=True, it will generate two images: one with a transparent background and one with a solid background.

:param prompt: The text prompt to generate the image.
:param negative_prompt: The text prompt to exclude from the image generation (optional).
:param steps: The number of diffusion steps (default is 20).
:param height: The height of the generated image (default is 512).
:param width: The width of the generated image (default is 512).
:param seed: Random seed for generation (default is -1 for random seed).
:param transparent: Whether to generate a transparent image (default is True).
:return: A tuple containing the generated image(s) and an error message if any.
'''

def generate_pixel_image(prompt, negative_prompt='', steps=20, height=512, width=512, seed=-1, transparent=True):
    # Define the payload
    payload = {
        "alwayson_scripts": {
            "API payload": {"args": []},
            "ControlNet": {
                "args": [
                    {
                        "batch_image_dir": "",
                        "batch_input_gallery": None,
                        "batch_mask_dir": "",
                        "batch_mask_gallery": None,
                        "control_mode": "Balanced",
                        "enabled": False,
                        "generated_image": None,
                        "guidance_end": 1.0,
                        "guidance_start": 0.0,
                        "hr_option": "Both",
                        "image": None,
                        "image_fg": None,
                        "input_mode": "simple",
                        "mask_image": None,
                        "mask_image_fg": None,
                        "model": "None",
                        "module": "None",
                        "pixel_perfect": False,
                        "processor_res": -1,
                        "resize_mode": "Crop and Resize",
                        "save_detected_map": True,
                        "threshold_a": -1,
                        "threshold_b": -1,
                        "use_preview_as_input": False,
                        "weight": 1
                    }
                ] * 3
            },
            "DynamicThresholding (CFG-Fix) Integrated": {
                "args": [False, 7, 1, "Constant", 0, "Constant", 0, 1, "enable", "MEAN", "AD", 1]
            },
            "Extra options": {"args": []},
            "FreeU Integrated (SD 1.x, SD 2.x, SDXL)": {
                "args": [False, 1.01, 1.02, 0.99, 0.95, 0, 1]
            },
            "Kohya HRFix Integrated": {
                "args": [False, 3, 2, 0, 0.35, True, "bicubic", "bicubic"]
            },
            "LatentModifier Integrated": {
                "args": [False, 0, "anisotropic", 0, "reinhard", 100, 0, "subtract", 0, 0, "gaussian", "add", 0, 100, 127, 0, "hard_clamp", 5, 0, "None", "None"]
            },
            "LayerDiffuse": {
                "args": [transparent, "(SD1.5) Only Generate Transparent Image (Attention Injection)", 1, 1, None, None, None, "Crop and Resize", False, "", "", ""]
            },
            "MultiDiffusion Integrated": {
                "args": [False, "MultiDiffusion", 768, 768, 64, 4]
            },
            "Never OOM Integrated": {
                "args": [False, False]
            },
            "PerturbedAttentionGuidance Integrated": {
                "args": [False, 3, 0, 0, 1]
            },
            "Refiner": {
                "args": [False, "", 0.8]
            },
            "Sampler": {
                "args": [20, "Euler a", "Automatic"]
            },
            "Seed": {
                "args": [-1, False, -1, 0, 0, 0]
            },
            "SelfAttentionGuidance Integrated (SD 1.x, SD 2.x, SDXL)": {
                "args": [False, 0.5, 2, 1]
            },
            "StyleAlign Integrated": {
                "args": [False, 1]
            }
        },
        "batch_size": 1,
        "cfg_scale": 7,
        "comments": {},
        "denoising_strength": 0.7,
        "disable_extra_networks": False,
        "distilled_cfg_scale": 3.5,
        "do_not_save_grid": False,
        "do_not_save_samples": False,
        "enable_hr": False,
        "height": height,
        "hr_additional_modules": ["Use same choices"],
        "hr_cfg": 7,
        "hr_distilled_cfg": 3.5,
        "hr_negative_prompt": "",
        "hr_prompt": "",
        "hr_resize_x": 0,
        "hr_resize_y": 0,
        "hr_scale": 2,
        "hr_second_pass_steps": 0,
        "hr_upscaler": "Latent",
        "n_iter": 1,
        "negative_prompt": negative_prompt,
        "override_settings": {},
        "override_settings_restore_afterwards": True,
        "prompt": prompt,
        "restore_faces": False,
        "s_churn": 0.0,
        "s_min_uncond": 0.0,
        "s_noise": 1.0,
        "s_tmax": None,
        "s_tmin": 0.0,
        "sampler_name": "Euler a",
        "scheduler": "Automatic",
        "script_args": [],
        "script_name": None,
        "seed": seed,
        "seed_enable_extras": True,
        "seed_resize_from_h": -1,
        "seed_resize_from_w": -1,
        "steps": steps,
        "styles": [],
        "subseed": -1,
        "subseed_strength": 0,
        "tiling": False,
        "width": width
    }

    # Send the POST request to the image generation API
    response = requests.post(f'{sd_backend_url}/sdapi/v1/txt2img', json=payload)

    if response.status_code == 200:
        response_json = response.json()
        images = response_json.get("images", [])
        result_images = []  # To store the decoded images
        if images:
            for i in images:
                image_data = base64.b64decode(i)
                image = Image.open(BytesIO(image_data))
                result_images.append(image)  # Append the decoded image to the list
            
            # Return the image object
            return result_images, None
        else:
            return None, "No images found in the response."
    else:
        return None, f"Request failed with status code: {response.status_code}"

# Example usage
if __name__ == "__main__":
    # prompt = "a red apple, single object, high quality"
    item_prompt_addition = "single object, high quality, devoid of any people, no human, no character, RPG games, item only"  # This can be used to enhance the prompt for better results
    item_negative_prompt_addition = "character, face, additional items or decorations, cover, container"
    weapon_prompt_addition = "weapon" 
    prompt = "a red apple"
    negative_prompt = ""
    # negative_prompt = "characters, face, extra details"
    # images, error = generate_pixel_image(prompt, negative_prompt)
    # # Display the image
    # for image in images:
    #     plt.imshow(image)
    #     plt.axis('off')  # Hide axes
    #     plt.show()
    
    # generate images with the same prompt and show them at once
    result_images = []  # To store the images generated in the loop
    for i in range(10):  # Generate 10 images with the same prompt for demonstration
        images, error = generate_pixel_image(",".join([prompt, item_prompt_addition]), item_negative_prompt_addition)
        if images:
            result_images.append(images[0])  # Add the generated images to the list
        else:
            print("Error:", error)
            break
    
    # Display all generated images at once
    
    if result_images:
        # Calculate the number of rows needed
        num_images = len(result_images)
        num_cols = 5  # Number of images per row
        num_rows = (num_images + num_cols - 1) // num_cols  # Calculate the required number of rows

        plt.figure(figsize=(15, num_rows * 3))  # Adjust height based on number of rows
        for idx, image in enumerate(result_images):
            plt.subplot(num_rows, num_cols, idx + 1)  # Create a subplot for each image
            plt.imshow(image)
            plt.axis('off')  # Hide axes
        plt.tight_layout()  # Adjust layout to prevent overlap
    plt.show()
    code.interact(local=locals())
    
    
    if images:
        print("Image generated successfully.")
    else:
        print("Error:", error)