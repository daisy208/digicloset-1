# Run Tests locally using Docker to avoid local env usage
Write-Host "Running End-to-End Tests via Docker..."

# Create a dedicated network
docker network create digicloset-test-net

try {
    # 1. Start Backend in background
    Write-Host "Starting Backend..."
    # Run with name 'backend' on the network
    $backendId = docker run -d --name backend --network digicloset-test-net backend:test
    
    # Wait for startup (simple sleep, ideally we'd poll /health)
    Start-Sleep -Seconds 10 

    # 2. Run Tests in a temporary container
    Write-Host "Running Tests..."
    # Mount tests dir, install deps, and run. 
    # Set API_BASE_URL to http://backend:8000 because they are on the same network.
    docker run --rm --network digicloset-test-net -v ${PWD}/tests:/tests -e API_BASE_URL=http://backend:8000 python:3.11-slim sh -c "pip install requests python-dotenv pytest && pytest -q /tests/unit/test_end_to_end.py"
}
finally {
    # 3. Cleanup
    Write-Host "Cleaning up..."
    docker stop backend
    docker rm backend
    docker network rm digicloset-test-net
}
