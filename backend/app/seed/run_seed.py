from app.seed import seed_questions, seed_students, seed_taxonomy


def main() -> None:
    seed_taxonomy.run()
    seed_questions.run()
    seed_students.run()


if __name__ == "__main__":
    main()
