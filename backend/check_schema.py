import asyncio
from database import get_supabase_client

client = get_supabase_client()
res = client.table('konsultan').select('*').limit(1).execute()
print("Columns in konsultan:")
if res.data:
    for k in res.data[0].keys():
        print(k)
else:
    print("No data, but we can try to insert/fail to see columns")
