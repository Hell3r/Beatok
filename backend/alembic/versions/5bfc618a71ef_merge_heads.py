"""merge heads

Revision ID: 5bfc618a71ef
Revises: abc123, dd7e76d6144b
Create Date: 2026-03-05 15:53:27.576397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5bfc618a71ef'
down_revision: Union[str, None] = ('abc123', 'dd7e76d6144b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
