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
                        "storyArc": "Rise",
                        "nodes": [
                            {
                                "nodeID": "1.1.1",
                                "storyline": "A young hero named Elian receives a transmission from a mysterious figure known as the Oracle, urging him to harness ancient powers in the skies above Neo-Silva City.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.2.1",
                                        "criteriaDescription": "Talked to the Oracle"
                                    },
                                    {
                                        "nodeID": "1.2.2",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "1.2.1",
                                "storyline": "Elian learns about the existence of the Aeons, powerful beings tethered to the energy of the city.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.3.1",
                                        "criteriaDescription": "Gained knowledge from the Oracle"
                                    }
                                ]
                            },
                            {
                                "nodeID": "1.2.2",
                                "storyline": "Elian decides to explore the Neon Spire to find a rumored Aeon who will lend him strength.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.3.2",
                                        "criteriaDescription": "Reached the Neon Spire"
                                    }
                                ]
                            },
                            {
                                "nodeID": "1.3.1",
                                "storyline": "Elian awakens his latent power of summoning and calls forth the Aeon of Storms, who joins him for his quest.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.4.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "1.3.2",
                                "storyline": "Upon arrival, Elian encounters an enigmatic hacker named Cyra who reveals a secret about the city.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.4.1",
                                        "criteriaDescription": "Gained Cyra's trust"
                                    }
                                ]
                            },
                            {
                                "nodeID": "1.4.1",
                                "storyline": "Elian and Cyra team up, uncovering the corruption of the ruling corporate syndicate, the Omnilectric Collective.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.5.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "1.5.1",
                                "storyline": "Joining forces with rebellious factions, they plan to lead a strike against Omnilectric to restore freedom to their city.",
                                "nextNode": [
                                    {
                                        "nodeID": "1.6.1",
                                        "criteriaDescription": "Join forces with rebels"
                                    },
                                    {
                                        "nodeID": "1.6.2",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "storyArc": "Fall",
                        "nodes": [
                            {
                                "nodeID": "2.1.1",
                                "storyline": "As the strike begins, the plan falls apart when a betrayal from within their ranks leads to heavy casualties.",
                                "nextNode": [
                                    {
                                        "nodeID": "2.2.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "2.1.2",
                                "storyline": "Elian realizes that the information given by Cyra was manipulated by the Omnilectric Collective to sabotage their efforts.",
                                "nextNode": [
                                    {
                                        "nodeID": "2.2.2",
                                        "criteriaDescription": "Confronted Cyra"
                                    },
                                    {
                                        "nodeID": "2.2.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "2.2.1",
                                "storyline": "In despair, Elian confronts the remnants of the rebellion and must decide whether to accept defeat or fight another day.",
                                "nextNode": [
                                    {
                                        "nodeID": "2.3.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "2.2.2",
                                "storyline": "Upon confronting Cyra, it is revealed that she was double-crossing him under duress, forcing Elian to choose between forgiveness or revenge.",
                                "nextNode": [
                                    {
                                        "nodeID": "2.3.2",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "2.3.1",
                                "storyline": "The shattered alliance reassembles, and Elian decides to pursue the final piece of the original plan: find the forgotten Aeon that can change the course of the conflict.",
                                "nextNode": [
                                    {
                                        "nodeID": "2.4.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "2.3.2",
                                "storyline": "Elian, driven by anger, decides to infiltrate the Omnilectric headquarters to gather intel and expose the truths behind the corruption.",
                                "nextNode": [
                                    {
                                        "nodeID": "2.4.2",
                                        "criteriaDescription": "Successfully infiltrated"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "storyArc": "Rise",
                        "nodes": [
                            {
                                "nodeID": "3.1.1",
                                "storyline": "Elian discovers the hidden entrance to the Aeon Shrine, where they hope to find the ancient Aeon of Light, who represents rebirth.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.2.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.1.2",
                                "storyline": "With allies gathered, including Cyra, the heroes raise their spirits to confront their fears and embrace the power of the Aeon.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.2.2",
                                        "criteriaDescription": "United as a team"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.2.1",
                                "storyline": "Elian encounters the trial of darkness where he must face his own fears embodied by shadowy figures from his past.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.3.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.2.2",
                                "storyline": "Through teamwork, the group faces down the manifestations of doubt and emerges stronger than ever.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.3.2",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.3.1",
                                "storyline": "Elian retrieves the Aeon of Light, who empowers him and the allies to reach their full potential.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.4.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.3.2",
                                "storyline": "United under the banner of hope, Elian and Cyra lead their forces to battle against the Omnilectric Collective in a final confrontation.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.4.2",
                                        "criteriaDescription": "Gathered enough allies"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.4.1",
                                "storyline": "Triumphant, Elian utilizes new powers to dismantle the Omnilectric forces in an epic showdown, restoring peace to Neo-Silva City.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.5.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.4.2",
                                "storyline": "With tenacity and resolve, Elian defeats the mega-corp and leads the populace into a new era of freedom and opportunity.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.5.2",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.5.1",
                                "storyline": "The city celebrates a newfound sense of unity and hope, as Elian emerges as a renowned hero, leading the next chapter of Neo-Silva.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.6.1",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
                            },
                            {
                                "nodeID": "3.5.2",
                                "storyline": "Elian dedicates himself to rebuilding the city amidst the vibrant glow of neon lights, determined to forge a legacy of peace.",
                                "nextNode": [
                                    {
                                        "nodeID": "3.6.2",
                                        "criteriaDescription": "No criteria"
                                    }
                                ]
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
