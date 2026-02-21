import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const exporter = new PrometheusExporter({ port: 9464 });

const sdk = new NodeSDK({
  metricReader: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
