import os
import logging
from app import create_app
from app.db_utils import verify_and_init_database


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    app = create_app()
    with app.app_context():
        verify_and_init_database()
    logging.getLogger("leapfrog.db").info("Database check completed successfully")


if __name__ == "__main__":
    main()
