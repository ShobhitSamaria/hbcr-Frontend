# HBCR API smoke tests

`smoke.sh` is a Bash script that exercises every endpoint implemented in
`src/`. Each line asserts one outcome against the running server.

## Usage

1. Start the server in one terminal:
   ```bash
   npm run start
   ```
2. Seed the database in another:
   ```bash
   npm run seed
   ```
3. Run the tests:
   ```bash
   ./tests/smoke.sh
   ```

A successful run prints `ALL OK` and exits with status `0`. The current
coverage is 46/46.

The script rewinds parts of the database (it does its own create + delete
within the test run), so re-running it on a seeded DB is safe.
