/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { observable } from "mobx";
import type { HelmRelease } from "../../../k8s/helm-release";

const releaseRollbackDialogStateInjectable = getInjectable({
  id: "release-rollback-dialog-state",
  instantiate: () => observable.box<HelmRelease | undefined>(undefined),
});

export default releaseRollbackDialogStateInjectable;
