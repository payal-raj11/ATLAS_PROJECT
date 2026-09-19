import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  village as initialVillage,
  parcels as initialParcels,
  surveyOfficers as initialSurveyOfficers,
  objections as initialObjections,
  disputes as initialDisputes,
  fieldVisits as initialFieldVisits,
  documents as initialDocuments,
  syncQueue as initialSyncQueue,
  gramSabha as initialGramSabha,
  statutoryAlerts as initialStatutoryAlerts,
} from "../data/atlasData";
import { api } from "../services/apiClient";

const STORAGE_KEY = "atlas-village-state-v2";

// Maps a live backend parcel into the field shape every page in this
// app already expects (surveyNo, owner, area, classification, ...).
// This keeps every existing component/reducer untouched -- only the
// SOURCE of the parcels array changes, not its shape.
function adaptParcel(p) {
  return {
    id: p.id,
    surveyNo: p.survey_number,
    owner: p.official_owner,
    area: `${(Number(p.land_area_sqm) / 10000).toFixed(3)} Ha`,
    classification: p.land_classification,
    recordStatus: p.record_status,
    scrutinyStatus: p.record_status === "Verified" ? "Verified" : "Pending",
    handoverStatus: p.record_status === "Verified" ? "Ready" : "Documents Pending",
    disputeStatus: "None", // per-parcel dispute detail needs a follow-up api.disputes.list(p.id) call
  };
}

const clone = (value) => JSON.parse(JSON.stringify(value));

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function createInitialState() {
  const defaults = {
    village: {
      ...clone(initialVillage),
      activeDisputes: initialDisputes.filter(
        (item) => !["Resolved", "Closed"].includes(item?.status)
      ).length,
    },
    parcels: clone(initialParcels),
    surveyOfficers: clone(initialSurveyOfficers),
    objections: clone(initialObjections),
    disputes: clone(initialDisputes),
    fieldVisits: clone(initialFieldVisits),
    documents: clone(initialDocuments),
    syncQueue: clone(initialSyncQueue),
    gramSabha: clone(initialGramSabha),
    statutoryAlerts: clone(initialStatutoryAlerts),
    lastSync: "2 min ago",
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    boundaryChecks: {},
    activityLog: [],
  };

  const saved = loadState();

  if (!saved) return defaults;

  return {
    ...defaults,
    ...saved,
    village: { ...defaults.village, ...(saved.village ?? {}) },
    gramSabha: { ...defaults.gramSabha, ...(saved.gramSabha ?? {}) },
    boundaryChecks: saved.boundaryChecks ?? {},
    activityLog: saved.activityLog ?? [],
    parcels: Array.isArray(saved.parcels) ? saved.parcels : defaults.parcels,
    surveyOfficers: Array.isArray(saved.surveyOfficers)
      ? saved.surveyOfficers
      : defaults.surveyOfficers,
    objections: Array.isArray(saved.objections)
      ? saved.objections
      : defaults.objections,
    disputes: Array.isArray(saved.disputes)
      ? saved.disputes
      : defaults.disputes,
    fieldVisits: Array.isArray(saved.fieldVisits)
      ? saved.fieldVisits
      : defaults.fieldVisits,
    documents: Array.isArray(saved.documents)
      ? saved.documents
      : defaults.documents,
    syncQueue: Array.isArray(saved.syncQueue)
      ? saved.syncQueue
      : defaults.syncQueue,
  };
}

const AtlasContext = createContext(null);

export function AtlasProvider({ children }) {
  const [state, setState] = useState(createInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Keep the UI usable if browser storage is unavailable.
    }
  }, [state]);

  useEffect(() => {
    const handleOnline = () => {
      setState((current) => ({
        ...current,
        online: true,
      }));
    };

    const handleOffline = () => {
      setState((current) => ({
        ...current,
        online: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const patch = (changes) => {
    setState((current) => ({ ...current, ...changes }));
  };

  // Pulls this village/survey user's real parcels from the backend
  // on mount and replaces the mock seed data with them. Falls back
  // silently to whatever's already in state (mock or cached) if the
  // request fails, so the app stays usable offline/without a token.
  useEffect(() => {
    let cancelled = false;
    api.parcels.list()
      .then((data) => {
        if (!cancelled && data.parcels?.length) {
          patch({ parcels: data.parcels.map(adaptParcel) });
        }
      })
      .catch(() => { /* stay on mock/cached data */ });
    return () => { cancelled = true; };
  }, []);

  const updateParcel = (surveyNo, changes) => {
    setState((current) => {
      const key = String(surveyNo);

      const target = current.parcels.find(
        (parcel) => String(parcel?.surveyNo) === key
      );

      if (!target) return current;

      const wasVerified = target.recordStatus === "Verified";
      const becomesVerified =
        changes.recordStatus !== undefined
          ? changes.recordStatus === "Verified"
          : wasVerified;

      const wasPending =
        target.scrutinyStatus === "Pending" ||
        target.recordStatus === "Missing RoR";

      const nextScrutiny = changes.scrutinyStatus ?? target.scrutinyStatus;
      const nextRecordStatus =
        changes.recordStatus ?? target.recordStatus;

      const becomesPending =
        changes.scrutinyStatus !== undefined ||
        changes.recordStatus !== undefined
          ? nextScrutiny === "Pending" ||
            nextRecordStatus === "Missing RoR"
          : wasPending;

      const hasActiveDispute =
        changes.disputeStatus !== undefined
          ? !["None", "Resolved", "Closed", ""].includes(
              String(changes.disputeStatus)
            )
          : !["None", "Resolved", "Closed", ""].includes(
              String(target.disputeStatus ?? "")
            );

      const boundaryIsClear =
        changes.boundaryStatus !== undefined
          ? String(changes.boundaryStatus) === "Clear"
          : String(target.boundaryStatus ?? "") === "Clear";

      const currentHandover =
        changes.handoverStatus ?? target.handoverStatus;

      let nextHandover = currentHandover;

      // Keep downstream handover readiness synchronized with parcel exceptions.
      // An active dispute/boundary clash always blocks handover.
      if (hasActiveDispute) {
        nextHandover = "Dispute Hold";
      } else if (
        changes.handoverStatus === undefined &&
        boundaryIsClear &&
        ["Dispute Hold", "Boundary Clash"].includes(String(currentHandover))
      ) {
        nextHandover = "Documents Pending";
      }

      const nextParcel = {
        ...target,
        ...changes,
        handoverStatus: nextHandover,
        lastUpdatedAt: new Date().toLocaleString(),
      };

      return {
        ...current,
        village: {
          ...current.village,
          verifiedParcels:
            current.village.verifiedParcels +
            Number(becomesVerified) -
            Number(wasVerified),
          pendingScrutiny:
            current.village.pendingScrutiny +
            Number(becomesPending) -
            Number(wasPending),
        },
        parcels: current.parcels.map((parcel) =>
          String(parcel?.surveyNo) === key ? nextParcel : parcel
        ),
      };
    });
  };

  const updateOfficer = (id, changes) => {
    setState((current) => ({
      ...current,
      surveyOfficers: current.surveyOfficers.map((officer) =>
        String(officer?.id ?? officer?.officerId ?? officer?.code) ===
        String(id)
          ? { ...officer, ...changes }
          : officer
      ),
    }));
  };

  // Compatibility alias used by the multistep Survey Officers page.
  const updateSurveyOfficer = (id, changes) => {
    updateOfficer(id, changes);
  };

  const updateObjection = (id, changes) => {
    setState((current) => {
      const existing = current.objections.find(
        (item) => String(item?.id) === String(id)
      );

      if (!existing) return current;

      const nextObjection = {
        ...existing,
        ...changes,
        updatedAt: new Date().toISOString(),
      };

      const objections = current.objections.map((item) =>
        String(item?.id) === String(id) ? nextObjection : item
      );

      const surveyNo = String(
        existing?.surveyNo ??
          existing?.survey ??
          existing?.parcelNo ??
          changes?.surveyNo ??
          changes?.survey ??
          changes?.parcelNo ??
          ""
      );

      const currentStatus = String(existing?.status ?? "");
      const nextStatus = String(changes?.status ?? currentStatus);

      const disputeStatusMap = {
        Pending: "Active",
        "Under Review": "Under Review",
        Forwarded: "Under Review",
        Escalated: "Escalated",
        Resolved: "Resolved",
        Rejected: "Closed",
      };

      const mappedDisputeStatus =
        disputeStatusMap[nextStatus] ?? undefined;

      const shouldCloseDispute =
        nextStatus === "Resolved" || nextStatus === "Rejected";

      const matchingDisputes = current.disputes.filter((dispute) => {
        const disputeSurvey = String(
          dispute?.surveyNo ??
            dispute?.survey ??
            dispute?.parcelNo ??
            ""
        );

        const linkedObjection = String(
          dispute?.objectionId ??
            dispute?.relatedObjectionId ??
            ""
        );

        return (
          (id &&
            (linkedObjection === String(id) ||
              String(dispute?.sourceObjectionId ?? "") === String(id))) ||
          (surveyNo && disputeSurvey === surveyNo)
        );
      });

      let disputes = current.disputes;

      if (mappedDisputeStatus || shouldCloseDispute) {
        disputes = current.disputes.map((dispute) => {
          const disputeSurvey = String(
            dispute?.surveyNo ??
              dispute?.survey ??
              dispute?.parcelNo ??
              ""
          );

          const linkedObjection = String(
            dispute?.objectionId ??
              dispute?.relatedObjectionId ??
              ""
          );

          const isLinked =
            (id &&
              (linkedObjection === String(id) ||
                String(dispute?.sourceObjectionId ?? "") === String(id))) ||
            (surveyNo && disputeSurvey === surveyNo);

          if (!isLinked) return dispute;

          return {
            ...dispute,
            status: mappedDisputeStatus ?? dispute.status,
            objectionId: dispute?.objectionId ?? id,
            lastUpdatedAt: new Date().toISOString(),
          };
        });
      } else if (
        ["Forwarded", "Under Review", "Escalated"].includes(nextStatus) &&
        surveyNo &&
        matchingDisputes.length === 0
      ) {
        // Automatically create the connected dispute record when an
        // objection is formally forwarded/escalated and no dispute exists.
        const newDisputeId = `DSP-${Date.now().toString().slice(-6)}`;

        disputes = [
          {
            id: newDisputeId,
            disputeId: newDisputeId,
            surveyNo,
            survey: surveyNo,
            type: nextObjection?.nature ?? "Public Objection",
            disputeType: nextObjection?.nature ?? "Public Objection",
            status:
              nextStatus === "Escalated"
                ? "Escalated"
                : "Under Review",
            priority: nextStatus === "Escalated" ? "High" : "Medium",
            objectionId: id,
            sourceObjectionId: id,
            objector:
              nextObjection?.objector ??
              nextObjection?.name ??
              "",
            description:
              nextObjection?.description ??
              nextObjection?.nature ??
              "Linked public objection",
            createdAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
          },
          ...current.disputes,
        ];
      }

      const activeDisputeStatuses = new Set([
        "Active",
        "Under Review",
        "Escalated",
      ]);

      const affectedSurveyNumbers = new Set();
      if (surveyNo) affectedSurveyNumbers.add(surveyNo);

      matchingDisputes.forEach((dispute) => {
        const linkedSurvey = String(
          dispute?.surveyNo ??
            dispute?.survey ??
            dispute?.parcelNo ??
            ""
        );
        if (linkedSurvey) affectedSurveyNumbers.add(linkedSurvey);
      });

      // Include a newly created dispute's parcel in synchronization.
      if (
        ["Forwarded", "Under Review", "Escalated"].includes(nextStatus) &&
        surveyNo
      ) {
        affectedSurveyNumbers.add(surveyNo);
      }

      const parcels = current.parcels.map((parcel) => {
        const parcelSurvey = String(parcel?.surveyNo ?? "");

        if (!affectedSurveyNumbers.has(parcelSurvey)) {
          return parcel;
        }

        const activeForParcel = disputes.filter((dispute) => {
          const disputeSurvey = String(
            dispute?.surveyNo ??
              dispute?.survey ??
              dispute?.parcelNo ??
              ""
          );

          return (
            disputeSurvey === parcelSurvey &&
            activeDisputeStatuses.has(
              String(dispute?.status ?? "")
            )
          );
        });

        return {
          ...parcel,
          disputeStatus: activeForParcel.length
            ? activeForParcel[0]?.disputeType ??
              activeForParcel[0]?.type ??
              "Public Objection"
            : "None",
          handoverStatus: activeForParcel.length
            ? "Dispute Hold"
            : parcel?.handoverStatus === "Dispute Hold"
            ? "Documents Pending"
            : parcel?.handoverStatus,
          lastUpdatedAt: new Date().toISOString(),
        };
      });

      const beforeActive = current.disputes.filter((dispute) =>
        activeDisputeStatuses.has(String(dispute?.status ?? ""))
      ).length;

      const afterActive = disputes.filter((dispute) =>
        activeDisputeStatuses.has(String(dispute?.status ?? ""))
      ).length;

      const affectedActivity = {
        type: "objection-status-sync",
        objectionId: id,
        surveyNo: surveyNo || undefined,
        message: `Objection ${id} moved to ${nextStatus}${
          surveyNo ? ` for Survey ${surveyNo}` : ""
        }`,
        timestamp: new Date().toISOString(),
      };

      return {
        ...current,
        objections,
        disputes,
        parcels,
        activityLog: [
          affectedActivity,
          ...current.activityLog,
        ],
        village: {
          ...current.village,
          activeDisputes:
            current.village.activeDisputes +
            (afterActive - beforeActive),
        },
      };
    });
  };

  const addObjection = (objection) => {
    setState((current) => ({
      ...current,
      objections: [objection, ...current.objections],
    }));
  };

  const updateDispute = (id, changes) => {
    setState((current) => {
      const existing = current.disputes.find(
        (item) =>
          String(item?.id ?? item?.disputeId) === String(id)
      );

      if (!existing) return current;

      const nextDispute = {
        ...existing,
        ...changes,
        lastUpdatedAt: new Date().toISOString(),
      };

      const previousStatus = String(existing?.status ?? "");
      const nextStatus = String(nextDispute?.status ?? previousStatus);

      const activeStatuses = new Set([
        "Active",
        "Under Review",
        "Escalated",
      ]);

      const wasActive = activeStatuses.has(previousStatus);
      const isActive = activeStatuses.has(nextStatus);

      const disputes = current.disputes.map((item) =>
        String(item?.id ?? item?.disputeId) === String(id)
          ? nextDispute
          : item
      );

      const surveyNo = String(
        existing?.surveyNo ??
          existing?.survey ??
          existing?.parcelNo ??
          nextDispute?.surveyNo ??
          nextDispute?.survey ??
          ""
      );

      const objectionStatusMap = {
        Active: "Pending",
        "Under Review": "Under Review",
        Escalated: "Escalated",
        Resolved: "Resolved",
        Closed: "Resolved",
        Rejected: "Rejected",
      };

      const linkedObjectionId =
        existing?.objectionId ??
        existing?.relatedObjectionId ??
        existing?.sourceObjectionId;

      const objections = current.objections.map((objection) => {
        const objectionSurvey = String(
          objection?.surveyNo ??
            objection?.survey ??
            objection?.parcelNo ??
            ""
        );

        const exactLink =
          linkedObjectionId &&
          String(objection?.id) === String(linkedObjectionId);

        const surveyLink =
          surveyNo && objectionSurvey === surveyNo;

        if (!exactLink && !surveyLink) {
          return objection;
        }

        const mappedStatus =
          objectionStatusMap[nextStatus] ??
          objection.status;

        return {
          ...objection,
          status: mappedStatus,
          disputeId: nextDispute?.id ?? nextDispute?.disputeId,
          lastUpdatedAt: new Date().toISOString(),
        };
      });

      const parcels = current.parcels.map((parcel) => {
        if (!surveyNo || String(parcel?.surveyNo) !== surveyNo) {
          return parcel;
        }

        return {
          ...parcel,
          disputeStatus: isActive
            ? nextDispute?.disputeType ??
              nextDispute?.type ??
              "Dispute"
            : "None",
          handoverStatus: isActive
            ? "Dispute Hold"
            : parcel?.handoverStatus === "Dispute Hold"
            ? "Documents Pending"
            : parcel?.handoverStatus,
          lastUpdatedAt: new Date().toISOString(),
        };
      });

      const syncedActivity = {
        type: "dispute-status-sync",
        disputeId: id,
        surveyNo: surveyNo || undefined,
        message: `Dispute ${id} moved from ${previousStatus || "Unknown"} to ${nextStatus}${
          surveyNo ? ` for Survey ${surveyNo}` : ""
        }`,
        timestamp: new Date().toISOString(),
      };

      return {
        ...current,
        disputes,
        objections,
        parcels,
        activityLog: [
          syncedActivity,
          ...current.activityLog,
        ],
        village: {
          ...current.village,
          activeDisputes:
            current.village.activeDisputes +
            Number(isActive) -
            Number(wasActive),
        },
      };
    });
  };

  const updateFieldVisit = (id, changes) => {
    setState((current) => {
      const target = current.fieldVisits.find(
        (item) =>
          String(item?.id) === String(id) ||
          String(item?.visitId) === String(id)
      );

      if (!target) return current;

      const wasCompleted = target.status === "Completed";
      const becomesCompleted = changes.status === "Completed";

      let officers = current.surveyOfficers;

      if (!wasCompleted && becomesCompleted) {
        officers = current.surveyOfficers.map((officer) => {
          const officerName =
            officer?.name ??
            officer?.officerName ??
            officer?.fullName ??
            "";

          const targetOfficerName =
            target?.officer ??
            target?.officerName ??
            target?.surveyOfficer ??
            "";

          if (String(officerName) !== String(targetOfficerName)) {
            return officer;
          }

          const completed =
            Number(officer?.completed ?? 0) + 1;

          const assigned = Math.max(
            Number(officer?.assigned ?? completed),
            completed
          );

          return {
            ...officer,
            completed,
            assigned,
            progress: assigned
              ? Math.round((completed / assigned) * 100)
              : 0,
          };
        });
      }

      return {
        ...current,
        surveyOfficers: officers,
        fieldVisits: current.fieldVisits.map((item) =>
          String(item?.id) === String(id) ||
          String(item?.visitId) === String(id)
            ? { ...item, ...changes }
            : item
        ),
      };
    });
  };

  const linkObjectionToDispute = (objectionId, disputeId) => {
    setState((current) => ({
      ...current,
      objections: current.objections.map((objection) =>
        String(objection?.id) === String(objectionId)
          ? {
              ...objection,
              disputeId,
              linkedAt: new Date().toISOString(),
            }
          : objection
      ),
      disputes: current.disputes.map((dispute) =>
        String(dispute?.id ?? dispute?.disputeId) === String(disputeId)
          ? {
              ...dispute,
              objectionId,
              sourceObjectionId: objectionId,
              lastUpdatedAt: new Date().toISOString(),
            }
          : dispute
      ),
    }));
  };

  const getParcelWorkflowState = (surveyNo) => {
    const key = String(surveyNo);

    const parcel = state.parcels.find(
      (item) => String(item?.surveyNo) === key
    );

    const relatedObjections = state.objections.filter(
      (item) =>
        String(
          item?.surveyNo ??
            item?.survey ??
            item?.parcelNo ??
            ""
        ) === key
    );

    const relatedDisputes = state.disputes.filter(
      (item) =>
        String(
          item?.surveyNo ??
            item?.survey ??
            item?.parcelNo ??
            ""
        ) === key
    );

    return {
      parcel,
      objections: relatedObjections,
      disputes: relatedDisputes,
      hasOpenObjection: relatedObjections.some(
        (item) =>
          !["Resolved", "Closed", "Rejected"].includes(
            String(item?.status ?? "")
          )
      ),
      hasActiveDispute: relatedDisputes.some(
        (item) =>
          ["Active", "Under Review", "Escalated"].includes(
            String(item?.status ?? "")
          )
      ),
    };
  };

  const clearParcelException = (surveyNo, source = "Workflow") => {
    const key = String(surveyNo);

    setState((current) => {
      const target = current.parcels.find(
        (parcel) => String(parcel?.surveyNo) === key
      );

      if (!target) return current;

      return {
        ...current,
        parcels: current.parcels.map((parcel) =>
          String(parcel?.surveyNo) === key
            ? {
                ...parcel,
                disputeStatus: "None",
                boundaryStatus:
                  parcel.boundaryStatus === "Boundary Clash"
                    ? "Clear"
                    : parcel.boundaryStatus,
                handoverStatus:
                  parcel.handoverStatus === "Dispute Hold"
                    ? "Documents Pending"
                    : parcel.handoverStatus,
                exceptionClearedBy: source,
                exceptionClearedAt: new Date().toLocaleString(),
                lastUpdatedAt: new Date().toLocaleString(),
              }
            : parcel
        ),
      };
    });
  };

  const addFieldVisit = (visit) => {
    setState((current) => ({
      ...current,
      surveyOfficers: current.surveyOfficers.map((officer) => {
        const officerName =
          officer?.name ??
          officer?.officerName ??
          officer?.fullName ??
          "";

        return String(officerName) === String(visit?.officer)
          ? {
              ...officer,
              assigned: Number(officer?.assigned ?? 0) + 1,
              status:
                officer.status === "Inactive"
                  ? "Active"
                  : officer.status,
            }
          : officer;
      }),
      fieldVisits: [visit, ...current.fieldVisits],
      syncQueue: [
        ...current.syncQueue,
        {
          id: visit?.id ?? visit?.visitId ?? `VIS-${Date.now()}`,
          type: "Field Visit",
          reference: `Survey ${visit?.surveyNo ?? visit?.survey ?? ""}`,
          size: "1.2 KB",
          status: "Pending",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const setGramSabha = (changes) => {
    setState((current) => ({
      ...current,
      gramSabha: {
        ...current.gramSabha,
        ...changes,
      },
    }));
  };

  const updateGramSabha = setGramSabha;

  const addActivity = (activity) => {
    setState((current) => ({
      ...current,
      activityLog: [activity, ...current.activityLog],
    }));
  };

  const addSyncItem = (item) => {
    setState((current) => ({
      ...current,
      syncQueue: [
        ...current.syncQueue,
        {
          ...item,
          id:
            item?.id ??
            item?.syncId ??
            `SYNC-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,
          createdAt:
            item?.createdAt ?? new Date().toISOString(),
        },
      ],
    }));
  };

  const updateSyncItem = (id, changes) => {
    setState((current) => ({
      ...current,
      syncQueue: current.syncQueue.map((item) =>
        String(item?.id ?? item?.syncId ?? item?.queueId) ===
        String(id)
          ? { ...item, ...changes }
          : item
      ),
    }));
  };

  const clearSyncQueue = () => {
    setState((current) => ({
      ...current,
      syncQueue: [],
      lastSync: "Just now",
    }));
  };

  const setOnline = (online) => {
    patch({ online: Boolean(online) });
  };

  const markSynced = () => {
    patch({
      lastSync: "Just now",
    });
  };

  const resetState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }

    setState(createInitialState());
  };

  const value = useMemo(
    () => ({
      ...state,

      // Parcel / officer workflows
      updateParcel,
      updateOfficer,
      updateSurveyOfficer,

      // Notifications / disputes
      updateObjection,
      addObjection,
      updateDispute,
      linkObjectionToDispute,
      getParcelWorkflowState,

      // Field visits
      updateFieldVisit,
      addFieldVisit,

      // Parcel exception workflow
      clearParcelException,

      // Gram Sabha
      setGramSabha,
      updateGramSabha,

      // Activity / sync
      addActivity,
      addSyncItem,
      updateSyncItem,
      clearSyncQueue,
      setOnline,
      markSynced,

      // Utility
      resetState,
    }),
    [state]
  );

  return (
    <AtlasContext.Provider value={value}>
      {children}
    </AtlasContext.Provider>
  );
}

export function useAtlas() {
  const context = useContext(AtlasContext);

  if (!context) {
    throw new Error(
      "useAtlas must be used inside AtlasProvider"
    );
  }

  return context;
}
