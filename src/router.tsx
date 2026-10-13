import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";
import { initializeMonitoring } from './lib/monitoring';

export function getRouter() {
  initializeMonitoring();
  return createRouter({ routeTree, defaultErrorComponent: AppErrorComponent });
}
