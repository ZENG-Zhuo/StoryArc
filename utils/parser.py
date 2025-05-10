import json
from json import JSONDecodeError
from pydantic import BaseModel, ValidationError

def parse_to_dataclass(dataclass: BaseModel, data: str | dict) -> BaseModel | None:
    '''A method for verifying the response structure'''
    try:
        # print("Raw response:", data)  # Debug print
        # print(f"the data type is {type(data)}")
        if isinstance(data, dict):
            json_data = data
        else:
            json_data = json.loads(data)
        # print(f"the json_data type is {type(json_data)}")
        res = dataclass.parse_obj(json_data)
        print("✅ Parsing is valid!")
        return res
    except ValidationError as e:
        print("❌ Parsing failed:")
        print(e.json(indent=2))
        print(f"the raw data is {data}")
    except JSONDecodeError as e:
        print("❌ JSON decoding failed:")
        print(e)
    except TypeError as e:
        print("❌ Type error:")
        print(e)
    return None
