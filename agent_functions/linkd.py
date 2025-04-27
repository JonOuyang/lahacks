import requests
from dotenv import load_dotenv
import os

load_dotenv()

def search_linkd(limit: int, query: str, school: str):

    try:
        url = "https://search.linkd.inc/api/search/users"

        querystring = {"limit":limit,"query": query,"school": school}
        
        headers = {"Authorization": f'Bearer {os.getenv("LINKD_TOKEN")}'}

        response = requests.request("GET", url, headers=headers, params=querystring)

        print(response.text)
    except Exception as e:
        print('sorry, it appears that the linkd API is currently down.')
        print(f'error message: {e}')