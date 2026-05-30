"use client";
import { StatusHistory, LoanStatus } from "@/types";
import { formatDate, getStatusConfig } from "@/lib/utils";
import { CheckCircle, Circle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

// PDF-mandated lifecycle steps in order
const TIMELINE_STEPS: { status: LoanStatus; label: string }[] = [
  { status: "APPLIED",    label: "Applied" },
  { status: "SANCTIONED", label: "Sanctioned" },
  { status: "DISBURSED",  label: "Disbursed" },
  { status: "CLOSED",     label: "Closed" },
];

export function LoanTimeline({
  history,
  currentStatus,
}: {
  history: StatusHistory[];
  currentStatus: LoanStatus;
}) {
  const isRejected = currentStatus === "REJECTED";

  if (isRejected) {
    const lastEntry = history[history.length - 1];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl border"
        style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
      >
        <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-400">Rejected</p>
          {lastEntry?.reason && (
            <p className="text-sm text-slate-400 mt-1">{lastEntry.reason}</p>
          )}
          <p className="text-xs text-slate-600 mt-1">
            {lastEntry ? formatDate(lastEntry.createdAt) : ""}
          </p>
        </div>
      </motion.div>
    );
  }

  const completedStatuses = history.map((h) => h.toStatus);

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = completedStatuses.includes(step.status);
        const isCurrent   = currentStatus === step.status;
        const entry       = history.find((h) => h.toStatus === step.status);
        const isLast      = idx === TIMELINE_STEPS.length - 1;

        return (
          <motion.div
            key={step.status}
            className="flex gap-4"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.35 }}
          >
            {/* Node + connector */}
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                  isCompleted || isCurrent
                    ? "border-teal-500 bg-teal-500/20"
                    : "border-slate-700 bg-slate-800/50"
                }`}
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 + 0.1, type: "spring", stiffness: 300 }}
              >
                {isCompleted ? (
                  <CheckCircle size={16} className="text-teal-400" />
                ) : isCurrent ? (
                  <motion.div
                    className="w-3 h-3 rounded-full bg-teal-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                ) : (
                  <Circle size={14} className="text-slate-600" />
                )}
              </motion.div>
              {!isLast && (
                <motion.div
                  className="w-0.5 mt-1"
                  style={{ height: 32 }}
                  initial={{ scaleY: 0, originY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2, duration: 0.3 }}
                >
                  <div
                    className={`w-full h-full ${isCompleted ? "bg-teal-500/40" : "bg-slate-700/50"}`}
                  />
                </motion.div>
              )}
            </div>

            {/* Label + meta */}
            <div className="pb-6">
              <p className={`text-sm font-semibold ${isCompleted || isCurrent ? "text-white" : "text-slate-600"}`}>
                {step.label}
              </p>
              {entry && (
                <div className="mt-1">
                  <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
                  {entry.changedBy && (
                    <p className="text-xs text-slate-600">
                      by{" "}
                      {typeof entry.changedBy === "object"
                        ? entry.changedBy.name
                        : "System"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
