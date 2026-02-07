#!/bin/bash
# Lineremain — Google Cloud Deployment Script
# Prerequisites: gcloud CLI installed and authenticated

set -e

PROJECT_ID="lineremain-game"
REGION="us-central1"
ZONE="us-central1-a"

echo "=== Lineremain Google Cloud Deployment ==="
echo ""
echo "This script will:"
echo "  1. Create a VM instance (e2-standard-4: 4 vCPU, 16GB RAM)"
echo "  2. Install Docker on the VM"
echo "  3. Deploy the game using Docker Compose"
echo ""

# Step 1: Create the VM
echo "Creating VM instance..."
gcloud compute instances create lineremain-server \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=lineremain-server \
  --metadata=startup-script='#!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose-v2 git
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $USER
  '

# Step 2: Create firewall rules
echo "Creating firewall rules..."
gcloud compute firewall-rules create lineremain-allow-web \
  --project=$PROJECT_ID \
  --allow=tcp:80,tcp:443,tcp:3001 \
  --target-tags=lineremain-server \
  --description="Allow HTTP, HTTPS, and game server traffic"

# Step 3: Get the external IP
EXTERNAL_IP=$(gcloud compute instances describe lineremain-server \
  --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "=== VM Created ==="
echo "External IP: $EXTERNAL_IP"
echo ""
echo "=== Next Steps (run manually) ==="
echo ""
echo "1. SSH into the VM:"
echo "   gcloud compute ssh lineremain-server --zone=$ZONE"
echo ""
echo "2. Clone your repo:"
echo "   git clone https://github.com/YOUR_USERNAME/lineremain.git"
echo "   cd lineremain"
echo ""
echo "3. Create .env file:"
echo "   cp .env.example .env"
echo "   nano .env"
echo "   # Set JWT_SECRET to a random string"
echo "   # Set VITE_API_URL=http://$EXTERNAL_IP:3001"
echo "   # Set VITE_WS_URL=ws://$EXTERNAL_IP:3001"
echo "   # Set NODE_ENV=production"
echo ""
echo "4. Build and run:"
echo "   docker compose up --build -d"
echo ""
echo "5. Open in browser:"
echo "   http://$EXTERNAL_IP"
echo ""
echo "=== Done! ==="