/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { action, makeObservable } from "mobx";
import type { TabId } from "../dock/store";
import type { DockTabStoreDependencies } from "../dock-tab-store/dock-tab.store";
import { DockTabStore } from "../dock-tab-store/dock-tab.store";
import { waitUntilDefined } from "../../../../common/utils/wait";
import type { GetHelmChartDetails } from "../../../k8s/helm-charts.api/get-details.injectable";
import type { GetHelmChartValues } from "../../../k8s/helm-charts.api/get-values.injectable";
import type { HelmReleaseUpdateDetails } from "../../../k8s/helm-releases.api/update.injectable";

export interface IChartInstallData {
  name: string;
  repo: string;
  version: string;
  values?: string;
  releaseName?: string;
  description?: string;
  namespace?: string;
  lastVersion?: boolean;
}

export interface InstallChartTabStoreDependencies extends DockTabStoreDependencies {
  versionsStore: DockTabStore<string[]>;
  detailsStore: DockTabStore<HelmReleaseUpdateDetails>;
  getHelmChartDetails: GetHelmChartDetails;
  getHelmChartValues: GetHelmChartValues;
}

export class InstallChartTabStore extends DockTabStore<IChartInstallData> {
  constructor(protected readonly dependencies: InstallChartTabStoreDependencies) {
    super(dependencies, { storageKey: "install_charts" });
    makeObservable(this);
  }

  get versions() {
    return this.dependencies.versionsStore;
  }

  get details() {
    return this.dependencies.detailsStore;
  }

  @action
  async loadData(tabId: string) {
    const promises = [];
    const data = await waitUntilDefined(() => this.getData(tabId));

    if (!this.getData(tabId)?.values) {
      promises.push(this.loadValues(tabId));
    }

    if (!this.versions.getData(tabId)) {
      promises.push(this.loadVersions(tabId, data));
    }

    await Promise.all(promises);
  }

  @action
  private async loadVersions(tabId: TabId, { repo, name, version }: IChartInstallData) {
    this.versions.clearData(tabId); // reset
    const charts = await this.dependencies.getHelmChartDetails(repo, name, { version });
    const versions = charts.versions.map(chartVersion => chartVersion.version);

    this.versions.setData(tabId, versions);
  }

  @action
  async loadValues(tabId: TabId, attempt = 0): Promise<void> {
    const data = await waitUntilDefined(() => this.getData(tabId));
    const { repo, name, version } = data;
    const values = await this.dependencies.getHelmChartValues(repo, name, version);

    if (values) {
      this.setData(tabId, { ...data, values });
    } else if (attempt < 4) {
      return this.loadValues(tabId, attempt + 1);
    }
  }
}
