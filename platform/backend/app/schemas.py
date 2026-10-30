from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ObservationInput(InputModel):
    node_id: str
    fact: str = Field(min_length=1, max_length=4000)
    evidence: str = Field(default="", max_length=4000)
    question: str = Field(default="", max_length=4000)


class FavoriteInput(InputModel):
    resource_id: str


class AnalysisInput(InputModel):
    favorite_id: str
    theme_id: str = "cryptomeria"
    question_id: str = "symptoms"
    observed: str = Field(default="", max_length=4000)
    meaning: str = Field(default="", max_length=4000)
    missing: str = Field(default="", max_length=4000)
    role: Literal["uncertain", "support", "weaken", "background"] = "uncertain"
    scope: str = Field(default="", max_length=4000)
    on_board: bool = False


class ArtifactInput(InputModel):
    theme_id: str = "cryptomeria"
    title: str = Field(min_length=1, max_length=120)
    summary: str = Field(default="", max_length=500)
    content: str = Field(default="", max_length=30000)
    evidence_ids: list[str] = Field(default_factory=list, max_length=50)
    status: Literal["draft", "archived"] = "draft"

    @field_validator("evidence_ids")
    @classmethod
    def unique_evidence(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))


class ProgressInput(InputModel):
    last_node: str | None = None
    theme_id: str = "cryptomeria"


class ReflectionInput(InputModel):
    text: str = Field(default="", max_length=5000)


class GuideInput(InputModel):
    question: str = Field(min_length=1, max_length=1200)
    page: str = Field(default="unknown", max_length=80)
    node_id: str | None = None
    theme_id: str = "cryptomeria"
