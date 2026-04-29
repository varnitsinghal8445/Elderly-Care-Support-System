import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class DatabaseConfig:
    """Database configuration class"""
    
    @staticmethod
    def get_database_uri():
        """Get database URI based on configuration"""
        database_type = os.getenv('DATABASE_TYPE', 'sqlite').lower()
        
        if database_type == 'mysql':
            return DatabaseConfig._get_mysql_uri()
        else:
            return DatabaseConfig._get_sqlite_uri()
    
    @staticmethod
    def _get_mysql_uri():
        """Get MySQL database URI"""
        host = os.getenv('MYSQL_HOST', 'localhost')
        port = os.getenv('MYSQL_PORT', '3306')
        username = os.getenv('MYSQL_USERNAME')
        password = os.getenv('MYSQL_PASSWORD')
        database = os.getenv('MYSQL_DATABASE', 'eldercare_db')
        
        if not username or not password:
            raise ValueError("MYSQL_USERNAME and MYSQL_PASSWORD must be set for MySQL")
        
        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
    
    @staticmethod
    def _get_sqlite_uri():
        """Get SQLite database URI"""
        basedir = os.path.abspath(os.path.dirname(__file__))
        db_path = os.getenv('SQLITE_DATABASE_PATH', 'eldercare.db')
        return f'sqlite:///{os.path.join(basedir, db_path)}'
    
    @staticmethod
    def get_flask_config():
        """Get Flask configuration"""
        return {
            'SQLALCHEMY_DATABASE_URI': DatabaseConfig.get_database_uri(),
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SECRET_KEY': os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        }
