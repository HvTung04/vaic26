from __future__ import annotations

from pydantic import BaseModel


class ClassDetail(BaseModel):
    id: str
    name: str
    subject: str
    grade: int
    teacher_id: str
    student_count: int


class ClassStudentItem(BaseModel):
    id: str
    full_name: str
    username: str


class ClassStudentsResponse(BaseModel):
    items: list[ClassStudentItem]
    total: int
