'''A module for interacting with the LLM'''

import os
from pathlib import Path
# from openai import OpenAI
# from openai.types import OpenAIError, APIConnectionError, RateLimitError, AuthenticationError, BadRequestError
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from portkey_ai import createHeaders, PORTKEY_GATEWAY_URL
from langchain_core.prompts import ChatPromptTemplate



load_dotenv()

CURRENT_PROMPT_VERSION = '20250415_1157'

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

        portkey_headers = createHeaders(
            api_key=os.getenv('PORTKEY_API_KEY'),
            virtual_key=os.getenv('VIRTUAL_KEY')
        )
        self.client = ChatOpenAI(
            base_url=PORTKEY_GATEWAY_URL,
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

        # self.client = OpenAI(
        #     api_key=os.getenv('OPENAI_API_KEY'),
        #     organization=os.getenv('OPENAI_ORG_ID'),
        #     project=os.getenv('PORTKEY_PROJECT_ID'),
        #     base_url=PORTKEY_GATEWAY_URL,
        #     default_headers=createHeaders(
        #         provider="openai",
        #         api_key=os.getenv('PORTKEY_API_KEY')
        #     )
        # )


    # def _single_send(self, user_prompt, system_prompt=None, temperature=1.0):
    #     '''A method for sending a single message to the GPT API'''

    #     formatted_message = []
    #     if system_prompt:
    #         formatted_message.append(self.formatter.sys_msg(system_prompt))
    #     formatted_message.append(self.formatter.user_msg(user_prompt))
    #     chat_complete = None
    #     try:
    #         chat_complete = self.client.chat.completions.create(
    #             model="gpt-4o",
    #             messages=formatted_message,
    #             temperature=temperature, # TODO: might need to adjust this
    #         )
    #     except RateLimitError as e:
    #         print("Rate limit exceeded. Please slow down or retry later.")
    #         print(e)

    #     except APIConnectionError as e:
    #         print("Network error: could not reach OpenAI servers.")
    #         print(e)

    #     except AuthenticationError as e:
    #         print("Invalid API key or authentication issue.")
    #         print(e)

    #     except BadRequestError as e:
    #         print("Bad request. Check your parameters or message format.")
    #         print(e)

    #     except OpenAIError as e:
    #         # Catch-all for other OpenAI-related errors
    #         print("An OpenAI error occurred.")
    #         print(e)
    #     if not chat_complete:
    #         return None
    #     response = chat_complete.choices[0].message.content
    #     print(response)
    #     return response

    def _load_prompt(self, prompt_name):
        '''Load prompt from file'''
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read().strip()

    def _init_chain(self, prompt_name):
        '''A method for initializing different chains'''
        # TODO:
        # - add system prompt from the prompts folder
        # - verify the response is in JSON 
        # return self._single_send(user_prompt, system_prompt)
        system_prompt = self._load_prompt(f'sys/{prompt_name}')
        user_prompt_template = self._load_prompt(f'user/{prompt_name}')
        print(f"system_prompt is {system_prompt}\n\n===========\n")
        print(f"user_prompt_template is {user_prompt_template}\n\n===========\n")
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
        response = self.story_chain.invoke({
            "story_description": story_description,
            "story_arc": story_arc,
            "num_endings": num_endings
        })
        # print(response) # Optional: print the raw response object
        return response.content # Assuming you want the text content

    # def generate_entity(self, story):
    def gen_entity(self, story_node):
        '''A method for generating an entity
        The output will be node with entity
        '''
        # TODO:
        # - verify the response is in JSON
        # - 
        response = self.entity_chain.invoke({
            "story_node": story_node
        })
        # print(response) # Optional: print the raw response object
        return response.content # Assuming you want the text content

    # def gen_node_with_entity(self, story_description, story_arc, num_endings):
    #     '''A method for generating a story node with an entity.
    #     Major function that will be used by frontend
    #     '''
    #     # TODO:
    #     # - verify the response is in JSON
    #     story_node = self.gen_story_node(story_description, story_arc, num_endings)
    #     entity = self.gen_entity(story_node)
    #     return entity

if __name__ == '__main__':
    # print("phase 1")
    # portkey_headers = createHeaders(api_key=os.getenv('PORTKEY_API_KEY'),virtual_key=os.getenv('VIRTUAL_KEY'))
    # llm = ChatOpenAI(api_key="X", base_url=PORTKEY_GATEWAY_URL, default_headers=portkey_headers, model="mistral-large-latest")
    # print(llm.invoke("What is the meaning of life, universe and everything?"))

    print("phase 2")
    gpt_client = GPTClient()
    # story_description = "a young girl, Red, who comes across a cunning wolf on the way to her grandmother's home. The wolf deceives both her and her grandmother and eats them"
    # story_arc= "Rise-Fall-Rise"
    # num_endings = 2
