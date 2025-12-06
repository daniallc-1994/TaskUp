import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from taskup_backend.app import create_app
from taskup_backend.models import Base, User, UserRole, Wallet, Task, Offer, Message, Payment, Transaction
from taskup_backend.security import create_token, hash_password
from taskup_backend.database import get_db


@pytest.fixture(scope="session")
def engine():
    return create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})


@pytest.fixture(scope="session")
def db_session(engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal


@pytest.fixture(scope="function")
def session(db_session):
    db = db_session()
    # clean tables
    for tbl in reversed(Base.metadata.sorted_tables):
        db.execute(tbl.delete())
    db.commit()
    yield db
    db.close()


@pytest.fixture(scope="function")
def client(session):
    app = create_app()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def _create_user(session, id: str, email: str, role: UserRole = UserRole.client):
    user = User(id=id, email=email, hashed_password=hash_password("pass123"), full_name=email.split("@")[0], role=role)
    session.add(user)
    wallet = Wallet(id=f"w-{id}", user_id=id, currency="NOK")
    session.add(wallet)
    session.commit()
    return user


@pytest.fixture
def user_client(session):
    return _create_user(session, "u-client", "client@example.com", UserRole.client)


@pytest.fixture
def user_tasker(session):
    return _create_user(session, "u-tasker", "tasker@example.com", UserRole.tasker)


@pytest.fixture
def admin_user(session):
    return _create_user(session, "u-admin", "admin@example.com", UserRole.admin)


def auth_header(user_id: str, email: str, role: str = "client"):
    token = create_token(user_id, email, role)
    return {"Authorization": f"Bearer {token}"}
