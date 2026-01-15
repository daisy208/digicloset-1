from locust import HttpUser, task, between

class DigiclosetUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        # Simulate login
        self.client.post("/auth/v1/token?grant_type=password", json={
            "email": "testuser@example.com",
            "password": "password123"
        })

    @task(2)
    def browse_products(self):
        self.client.get("/api/products")

    @task(1)
    def upload_product(self):
        self.client.post("/api/products", json={
            "name": "Test Item",
            "category": "Shirts"
        })

    @task(3)
    def try_on_virtual(self):
        self.client.get("/api/tryon/sample")

    @task(1)
    def logout(self):
        self.client.post("/auth/v1/logout")
