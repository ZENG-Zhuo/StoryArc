'''A module for interacting with the LLM'''

import os
import json
from pathlib import Path
# from openai import OpenAI
# from openai.types import OpenAIError,\
#  APIConnectionError, RateLimitError, AuthenticationError, BadRequestError
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
# from langchain_core.messages.chat import ChatMessage
from langchain_core.prompts import ChatPromptTemplate
from portkey_ai import createHeaders
from pydantic import ValidationError, BaseModel

from world_generator.model.story_node import StoryStructure



load_dotenv()

CURRENT_PROMPT_VERSION = '20250424_1107'

class Formatter:
    '''A class for formatting the input to the LLM'''

    def _get_formatted_dict(self, content, role):
        '''A method for formatting the input to the LLM'''
        # openAI official
        # res = {
        #     # Available roles are: ["system", "user", "assistant"]
        #     "role": role,
        #     "content": content,
        # }
        # Langchain
        res = (role, content)
        return res

    def ai_msg(self, content):
        '''A method for formatting the AI input to the LLM'''
        return self._get_formatted_dict(content, "assistant")

    def user_msg(self, content):
        '''A method for formatting the user input to the LLM'''
        return self._get_formatted_dict(content, "user")

    def sys_msg(self, content):
        '''A method for formatting the system input to the LLM'''
        return self._get_formatted_dict(content, "system")

class GPTClient:
    '''A class for interacting with the GPT API'''
    def __init__(self):
        self.formatter = Formatter()

        # config = {
        #     "virtual_key": os.getenv('VIRTUAL_KEY')
        # }
        portkey_headers = createHeaders(
            api_key=os.getenv('PORTKEY_API_KEY'),
            virtual_key=os.getenv('VIRTUAL_KEY')
            # config = config 
        )
        self.client = ChatOpenAI(
            base_url=os.getenv('BASE_URL'),
            default_headers=portkey_headers,
            api_key='X',
            # temperature = 1.0,
            # max_tokens=None,
            # timeout=None,
            # max_retries=2,
        )

        module_dir = Path(__file__).parent
        # directory to store prompts. Can change this to different versions
        self.prompts_dir = module_dir / 'prompts' / CURRENT_PROMPT_VERSION

        # get chains
        self.story_chain = self._init_chain('gen_story')
        self.entity_chain = self._init_chain('gen_entity')

    def _load_prompt(self, prompt_name):
        '''Load prompt from file'''
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read().strip()

    def _init_chain(self, prompt_name, escape_system_prompt_braces=True):
        '''A method for initializing different chains'''
        # TODO:
        # - add system prompt from the prompts folder
        # - verify the response is in JSON 
        # return self._single_send(user_prompt, system_prompt)
        system_prompt = self._load_prompt(f'sys/{prompt_name}')
        user_prompt_template = self._load_prompt(f'user/{prompt_name}')
        # print(f"system_prompt is {system_prompt}\n\n===========\n")
        # print(f"user_prompt_template is {user_prompt_template}\n\n===========\n")
        if escape_system_prompt_braces:
            system_prompt = self.escape_curly_braces(system_prompt)
        prompt = ChatPromptTemplate.from_messages([
            self.formatter.sys_msg(system_prompt),
            self.formatter.user_msg(user_prompt_template)
        ])
        chain = prompt | self.client
        # print(chain)
        return chain

    def gen_story_node(self, story_description, story_arc, num_endings):
        '''A method for generating a story node'''
        # TODO:
        # - verify the response is in JSON
        # - handle error
        response = self.story_chain.invoke({
            "story_description": story_description,
            "story_arc": story_arc,
            "num_endings": num_endings
        })
        res_content = response.content

        # for testing
        # res_content = self.dummy_gen_story_node(story_description, story_arc, num_endings)

        # clean the response
        res_content = self.clean_json(res_content)
        if self.verify_response_structure(StoryStructure, res_content):
            return res_content
        return None # TODO: handle error


    def gen_entity(self, story_node):
        '''A method for generating an entity
        The output will be node with entity
        '''
        # TODO:
        # - verify the response is in JSON
        response = self.entity_chain.invoke({
            "story_node": story_node
        })
        return response.content # Assuming you want the text content

    def verify_response_structure(self, dataclass: BaseModel, data: str):
        '''A method for verifying the response structure'''
        try:
            # print("Raw response:", data)  # Debug print
            json_data = json.loads(data)
            dataclass.from_list(json_data)
            print("✅ The response is valid!")
        except ValidationError as e:
            print("❌ Validation failed:")
            print(e.json(indent=2))
            print(f"the raw data is {data}")
            return False
        return True

    def clean_json(self, text: str) -> str:
        '''A method for cleaning the JSON string
        1. gpt might return ```json``` to wrap the json. remove
        '''
        if text.startswith('```'):
            text = text.split('\n', 1)[1]  # Remove first line
        if text.endswith('```'):
            text = text.rsplit('\n', 1)[0]  # Remove last line
        return text

    def escape_curly_braces(self, text: str) -> str:
        '''A method for escaping curly braces. For sys prompts'''
        return text.replace("{", "{{").replace("}", "}}")

    def dummy_gen_story_node(self, story_description, story_arc, num_endings):
        '''A dummy method for generating a story node. For integration testing'''
        data = '''```json
[
    {
        "storyArc": "Rise-Fall-Rise",
        "nodes": [
            {
                "nodeID": "1",
                "storyline": "Red leaves her colorful, folklore-rich village carrying a basket of herbal breads and sweet juniper wine for Grandmother, who lives deep in the Singing Pines—an ancient forest known for its whispering trees and time-bending paths.",
                "nextNode": [
                    { "nodeID": "2", "criteriaDescription": "no criteria" }
                ]
            },
            {
                "nodeID": "2",
                "storyline": "Red meets a curious fox spirit who warns her: the forest paths are shifting today, and she should not talk to strangers. Red thanks the spirit and continues with caution.",
                "nextNode": [
                    { "nodeID": "3", "criteriaDescription": "talk to the fox spirit" }
                ]
            },
            {
                "nodeID": "3",
                "storyline": "At a fork under a whispering tree, Red encounters a charming wolf dressed in a traveling cloak. The wolf asks where Red is headed and offers a 'shortcut' through the Duskroot Trail—a rarely used path said to echo past footsteps.",
                "nextNode": [
                    { "nodeID": "4", "criteriaDescription": "talk to the wolf" },
                    { "nodeID": "5", "criteriaDescription": "refuse to talk to the wolf and take the main trail" }
                ]
            },
            {
                "nodeID": "4",
                "storyline": "Red trusts the wolf and takes the shortcut. The path disorients her, and strange forest illusions lure her into losing time. Meanwhile, the wolf reaches Grandmother’s cottage first.",
                "nextNode": [
                    { "nodeID": "6", "criteriaDescription": "no criteria" }
                ]
            },
            {
                "nodeID": "5",
                "storyline": "Red takes the main trail, passing by a shrine with runes glowing faintly. She prays briefly, and an owl guardian gifts her a pine-sigil for protection.",
                "nextNode": [
                    { "nodeID": "6", "criteriaDescription": "talk to the owl guardian" }
                ]
            },
            {
                "nodeID": "6",
                "storyline": "Red arrives at the cottage. The door is slightly ajar. The cottage smells faintly of juniper but something feels wrong. Grandmother's shawl is on the floor.",
                "nextNode": [
                    { "nodeID": "7", "criteriaDescription": "enter the cottage quietly" },
                    { "nodeID": "8", "criteriaDescription": "call out to Grandmother loudly" }
                ]
            },
            {
                "nodeID": "7",
                "storyline": "Red sneaks in and sees the wolf in Grandmother’s clothing. She hides and notices Grandmother trapped under the bed.",
                "nextNode": [
                    { "nodeID": "9", "criteriaDescription": "free Grandmother while distracting the wolf" },
                    { "nodeID": "10", "criteriaDescription": "confront the wolf directly" }
                ]
            },
            {
                "nodeID": "8",
                "storyline": "Red's loud voice alerts the wolf, who pounces. Red barely has time to scream before she’s trapped.",
                "nextNode": [
                    { "nodeID": "10", "criteriaDescription": "no criteria" }
                ]
            },
            {
                "nodeID": "9",
                "storyline": "Red tosses a bread roll at the wolf, who turns, and pulls Grandmother free. Grandmother activates a protective hearth rune, and the wolf is expelled from the cottage in a burst of light.",
                "nextNode": [
                    { "nodeID": "11", "criteriaDescription": "no criteria" }
                ]
            },
            {
                "nodeID": "10",
                "storyline": "The wolf overpowers Red and swallows both her and Grandmother. However, a nearby woodsman hears the commotion.",
                "nextNode": [
                    { "nodeID": "12", "criteriaDescription": "talk to the woodsman NPC" }
                ]
            },
            {
                "nodeID": "11",
                "storyline": "With the wolf gone, Red and Grandmother enjoy the herbal breads in peace. The forest’s spirits bless Red for her bravery and cleverness.",
                "nextNode": []
            },
            {
                "nodeID": "12",
                "storyline": "The woodsman defeats the wolf, cuts open its belly, and saves Red and Grandmother. They sew the wolf’s belly with nettle thorns, ensuring he never harms another soul.",
                "nextNode": []
            }
        ]
    }
]

                ```'''
        return data

    def dummy_gen_entity(self, story_node):
        '''A dummy method for generating an entity. For integration testing'''
        pass

# if __name__ == '__main__':
#     print("phase 2")
#     gpt_client = GPTClient()
#     STORY_DESCRIPTION = "a young girl, \
#         Red, who comes across a cunning wolf on the way to her grandmother's home. \
#         The wolf deceives both her and her grandmother and eats them"
#     STORY_ARC= "Rise-Fall-Rise"
#     NUM_ENDINGS = 2
#     story_node = gpt_client.gen_story_node(STORY_DESCRIPTION, STORY_ARC, NUM_ENDINGS)
#     print(story_node)
