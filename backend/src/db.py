# import os
# from dotenv import load_dotenv
# from sqlalchemy import create_engine
# import pandas as pd

# # Load environment variables from .env.local
# load_dotenv(dotenv_path=".env.local")

# # Set up Neon database URL
# NEON_DB_URL = os.getenv("NEON_DB_URL")
# if not NEON_DB_URL:
#     raise ValueError("Missing NEON_DB_URL in .env.local")
# os.environ["NEON_DB_URL"] = NEON_DB_URL

# DATABASE_URL = NEON_DB_URL

# # Create SQLAlchemy engine
# engine = create_engine(DATABASE_URL)
