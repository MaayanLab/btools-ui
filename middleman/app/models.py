import json
import os
from uuid import uuid4
import flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB, UUID
from dotenv import load_dotenv

load_dotenv(verbose=True)
app = flask.Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('POSTGRES_URI', '')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Resource(db.Model):
  __tablename__ = 'resources'

  uuid = db.Column(UUID(as_uuid=True), primary_key=True)
  meta =  db.Column(JSONB)
  libraries = db.relationship('Library', backref='resources', lazy=True)

  def __init__(self, kwargs):
    self.uuid = kwargs["id"]
    self.meta = kwargs["meta"]

  def update(self, kwargs):
    self.uuid = kwargs["id"]
    self.meta = kwargs["meta"]

  def __repr__(self):
    return '<id {}>'.format(self.uuid)

  @property
  def serialize(self):
    """Return object data in easily serializeable format"""
    return {
      '$validator': '/dcic/signature-commons-schema/v5/core/resource.json',
      'id': self.uuid,
      # TODO: add context to actual model instead of here
      'meta': self.meta,
    }

class Library(db.Model):
  __tablename__ = 'libraries'

  uuid = db.Column(UUID(as_uuid=True), primary_key=True)
  resource = db.Column(UUID(as_uuid=True), db.ForeignKey('resources.uuid'), nullable=True)
  dataset = db.Column(db.String())
  dataset_type = db.Column(db.String())
  meta =  db.Column(JSONB)
  signatures = db.relationship('Signature', backref='libraries', lazy=True)

  def __init__(self, kwargs):
    self.uuid = kwargs["id"]
    self.resource = kwargs.get("resource")
    self.dataset = kwargs["dataset"]
    self.dataset_type = kwargs["dataset_type"]
    self.meta = kwargs["meta"]

  def update(self, kwargs):
    self.uuid = kwargs["id"]
    self.resource = kwargs.get("resource")
    self.dataset = kwargs["dataset"]
    self.dataset_type = kwargs["dataset_type"]
    self.meta = kwargs["meta"]

  def __repr__(self):
    return '<id {}>'.format(self.uuid)

  @property
  def serialize(self):
    """Return object data in easily serializeable format"""
    return {
      '$validator': '/dcic/signature-commons-schema/v5/core/library.json',
      'id': self.uuid,
      'resource': self.resource,
      'dataset': self.dataset,
      'dataset_type': self.dataset_type,
      'meta': self.meta,
    }

class Signature(db.Model):
  __tablename__ = 'signatures'

  uuid = db.Column(UUID(as_uuid=True), primary_key=True)
  libid = db.Column(UUID(as_uuid=True), db.ForeignKey('libraries.uuid'), nullable=False)
  meta =  db.Column(JSONB)
  
  def __init__(self, kwargs):
    self.uuid = kwargs["id"]
    self.libid = kwargs["library"]
    self.meta = kwargs["meta"]

  def update(self, kwargs):
    self.uuid = kwargs["id"]
    self.libid = kwargs["library"]
    self.meta = kwargs["meta"]

  def __repr__(self):
    return '<id {}>'.format(self.uuid)

  @property
  def serialize(self):
    """Return object data in easily serializeable format"""
    return {
      '$validator': '/dcic/signature-commons-schema/v5/core/signature.json',
      'id': self.uuid,
      'library': self.libid,
      'meta': self.meta,
    }

class Entity(db.Model):
  __tablename__ = 'entities'

  uuid = db.Column(UUID(as_uuid=True), primary_key=True)
  meta =  db.Column(JSONB)
  
  def __init__(self, kwargs):
    self.uuid = kwargs["id"]
    self.meta = kwargs["meta"]
  
  def update(self, kwargs):
    self.uuid = kwargs["id"]
    self.meta = kwargs["meta"]

  def __repr__(self):
    return '<id {}>'.format(self.uuid)

  @property
  def serialize(self):
    """Return object data in easily serializeable format"""
    return {
      '$validator': '/dcic/signature-commons-schema/v5/core/entity.json',
      'id': self.uuid,
      'meta': self.meta,
    }