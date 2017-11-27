docker-compose -f test.yml build
docker-compose -f test.yml run --rm api
docker-compose -f test.yml down
