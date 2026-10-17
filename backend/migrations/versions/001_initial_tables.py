"""Initial migration creating all 30 core election tables

Revision ID: 001_initial_tables
Revises: 
Create Date: 2026-10-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Election Types
    op.create_table(
        'election_types',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 2. Elections
    op.create_table(
        'elections',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('election_type_id', sa.String(length=36), sa.ForeignKey('election_types.id'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('election_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('is_demonstration', sa.Boolean(), nullable=False),
        sa.Column('source_reference', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 3. States
    op.create_table(
        'states',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('zone', sa.String(length=50), nullable=False),
        sa.Column('total_lgas', sa.Integer(), nullable=False),
        sa.Column('total_pus', sa.Integer(), nullable=False),
        sa.Column('registered_voters', sa.Integer(), nullable=False),
        sa.Column('latitude', sa.Numeric(9, 6), nullable=True),
        sa.Column('longitude', sa.Numeric(9, 6), nullable=True),
    )

    # 4. LGAs
    op.create_table(
        'lgas',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('state_id', sa.String(length=36), sa.ForeignKey('states.id'), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('total_wards', sa.Integer(), nullable=False),
        sa.Column('total_pus', sa.Integer(), nullable=False),
    )

    # 5. Wards
    op.create_table(
        'wards',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('lga_id', sa.String(length=36), sa.ForeignKey('lgas.id'), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('total_pus', sa.Integer(), nullable=False),
    )

    # 6. Polling Units
    op.create_table(
        'polling_units',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('ward_id', sa.String(length=36), sa.ForeignKey('wards.id'), nullable=False),
        sa.Column('election_id', sa.String(length=36), sa.ForeignKey('elections.id'), nullable=False),
        sa.Column('registered_voters', sa.Integer(), nullable=False),
        sa.Column('accredited_voters', sa.Integer(), nullable=False),
        sa.Column('upload_status', sa.String(length=50), nullable=False),
        sa.Column('transcription_status', sa.String(length=50), nullable=False),
        sa.Column('verification_status', sa.String(length=50), nullable=False),
        sa.Column('source_upload_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_retrieved_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('latitude', sa.Numeric(9, 6), nullable=True),
        sa.Column('longitude', sa.Numeric(9, 6), nullable=True),
    )

    # 7. Political Parties
    op.create_table(
        'political_parties',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('code', sa.String(length=20), nullable=False, unique=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('color', sa.String(length=10), nullable=False),
    )

    # 8. Candidates
    op.create_table(
        'candidates',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('party_id', sa.String(length=36), sa.ForeignKey('political_parties.id'), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('running_mate', sa.String(length=200), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('candidates')
    op.drop_table('political_parties')
    op.drop_table('polling_units')
    op.drop_table('wards')
    op.drop_table('lgas')
    op.drop_table('states')
    op.drop_table('elections')
    op.drop_table('election_types')
