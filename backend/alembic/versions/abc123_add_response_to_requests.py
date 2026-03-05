"""add response and response_at to requests

Revision ID: abc123
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('requests', sa.Column('response', sa.String(2000), nullable=True))
    op.add_column('requests', sa.Column('response_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('requests', 'response_at')
    op.drop_column('requests', 'response')

