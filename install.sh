#!/bin/bash
set -e

echo "======================================"
echo "VirtualFit GPU Auto-Scaling Setup"
echo "======================================"
echo ""

check_prereqs() {
    echo "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl not found. Please install kubectl first."
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        echo "❌ helm not found. Please install helm first."
        exit 1
    fi

    echo "✅ Prerequisites check passed"
    echo ""
}

install_keda() {
    echo "Installing KEDA..."

    if helm list -n keda | grep -q keda; then
        echo "⚠️  KEDA already installed. Skipping..."
    else
        helm repo add kedacore https://kedacore.github.io/charts
        helm repo update
        helm install keda kedacore/keda --namespace keda --create-namespace --wait
        echo "✅ KEDA installed successfully"
    fi
    echo ""
}

install_gpu_operator() {
    echo "Installing NVIDIA GPU Operator..."

    if helm list -n gpu-operator | grep -q gpu-operator; then
        echo "⚠️  GPU Operator already installed. Skipping..."
    else
        helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
        helm repo update
        helm install --wait --generate-name \
          -n gpu-operator --create-namespace \
          nvidia/gpu-operator
        echo "✅ GPU Operator installed successfully"
    fi
    echo ""
}

deploy_dcgm_exporter() {
    echo "Deploying NVIDIA DCGM Exporter..."
    kubectl apply -f nvidia-gpu-operator.yaml
    echo "✅ DCGM Exporter deployed"
    echo ""
}

deploy_keda_scaler() {
    echo "Deploying KEDA GPU Scaler..."
    kubectl apply -f keda-gpu-scaler.yaml
    echo "✅ KEDA GPU Scaler deployed"
    echo ""
}

deploy_prometheus_adapter() {
    echo "Deploying Prometheus Adapter (optional)..."
    read -p "Do you want to deploy Prometheus Adapter for HPA? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl apply -f prometheus-adapter.yaml
        echo "✅ Prometheus Adapter deployed"
    else
        echo "⏭️  Skipping Prometheus Adapter"
    fi
    echo ""
}

update_prometheus_config() {
    echo "Updating Prometheus configuration..."
    echo "⚠️  Manual step required:"
    echo "1. Edit Prometheus ConfigMap to add DCGM scrape config"
    echo "2. Run: kubectl edit configmap prometheus-config -n monitoring"
    echo "3. Add the scrape config from gpu-autoscaling-guide.md"
    echo "4. Reload Prometheus: kubectl rollout restart deployment/prometheus -n monitoring"
    echo ""
    read -p "Press Enter when you've updated Prometheus config, or Ctrl+C to skip..."
    echo ""
}

verify_installation() {
    echo "Verifying installation..."
    echo ""

    echo "Checking KEDA pods..."
    kubectl get pods -n keda
    echo ""

    echo "Checking GPU Operator pods..."
    kubectl get pods -n gpu-operator
    echo ""

    echo "Checking DCGM Exporter..."
    kubectl get pods -n gpu-operator -l app=nvidia-dcgm-exporter
    echo ""

    echo "Checking ScaledObject..."
    kubectl get scaledobject -n virtualfit
    echo ""

    echo "Checking HPA..."
    kubectl get hpa -n virtualfit
    echo ""
}

print_next_steps() {
    echo "======================================"
    echo "✅ Installation Complete!"
    echo "======================================"
    echo ""
    echo "Next Steps:"
    echo "1. Verify GPU metrics are available in Prometheus"
    echo "   kubectl port-forward -n monitoring svc/prometheus 9090:9090"
    echo "   Visit: http://localhost:9090 and query: DCGM_FI_DEV_GPU_UTIL"
    echo ""
    echo "2. Watch your pods scale"
    echo "   kubectl get pods -n virtualfit -w"
    echo ""
    echo "3. Monitor in Grafana dashboard"
    echo "   kubectl port-forward -n monitoring svc/grafana 3000:3000"
    echo "   Visit: http://localhost:3000"
    echo ""
    echo "4. Test autoscaling with load"
    echo "   See gpu-autoscaling-guide.md for load testing instructions"
    echo ""
    echo "For detailed information, see: gpu-autoscaling-guide.md"
}

main() {
    check_prereqs
    install_keda
    install_gpu_operator
    deploy_dcgm_exporter
    deploy_keda_scaler
    deploy_prometheus_adapter
    update_prometheus_config
    verify_installation
    print_next_steps
}

main
