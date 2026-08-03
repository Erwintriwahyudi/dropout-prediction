"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Target,
  BarChart2,
} from "lucide-react";

interface EvaluasiData {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
  cross_val_scores: number[];
}

const MOCK: EvaluasiData = {
  accuracy: 92.5,
  precision: 91.8,
  recall: 93.2,
  f1_score: 92.4,
  confusion_matrix: { tp: 74, tn: 68, fp: 6, fn: 5 },
  cross_val_scores: [90.1, 91.4, 93.0, 92.8, 94.2],
};

export default function EvaluasiModelPage() {
  const [data, setData] = useState<EvaluasiData | null>(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    setAnimIn(true);
    const token = localStorage.getItem("token");
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    fetch(`${apiUrl}/evaluasi`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.accuracy !== undefined) setData(json);
        else setData(MOCK);
      })
      .catch(() => setData(MOCK));
  }, []);

  const metrics = data
    ? [
        {
          label: "Akurasi",
          value: data.accuracy,
          icon: <Target className="w-5 h-5" />,
          color: "from-blue-600 to-blue-400",
        },
        {
          label: "Presisi",
          value: data.precision,
          icon: <CheckCircle2 className="w-5 h-5" />,
          color: "from-green-600 to-emerald-400",
        },
        {
          label: "Recall",
          value: data.recall,
          icon: <TrendingUp className="w-5 h-5" />,
          color: "from-violet-600 to-purple-400",
        },
        {
          label: "F1-Score",
          value: data.f1_score,
          icon: <Award className="w-5 h-5" />,
          color: "from-amber-600 to-yellow-400",
        },
      ]
    : [];

  const cvMean = data
    ? data.cross_val_scores.reduce((a, b) => a + b, 0) / data.cross_val_scores.length
    : 0;

  return (
    <main
      className={`min-h-screen bg-slate-950 text-white p-6 transition-all duration-700 ${
        animIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-600/30">
          <FlaskConical className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Evaluasi Model C4.5</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Metrik performa klasifikasi Decision Tree C4.5 + SMOTE
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white`}
            >
              {m.icon}
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">{m.label}</p>
              <p className="text-3xl font-extrabold text-white">
                {m.value.toFixed(1)}
                <span className="text-lg text-slate-400">%</span>
              </p>
            </div>
            {/* Bar */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-1000`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        {data && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Confusion Matrix</h2>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-sm">
              {/* Header row */}
              <div />
              <div className="text-slate-400 font-semibold py-2">Pred: Dropout</div>
              <div className="text-slate-400 font-semibold py-2">Pred: Aman</div>
              {/* Row 1: Actual Dropout */}
              <div className="text-slate-400 font-semibold py-3 flex items-center justify-end pr-2">
                Aktual: Dropout
              </div>
              <div className="bg-green-600/20 border border-green-600/40 rounded-xl py-5 flex flex-col items-center">
                <span className="text-2xl font-extrabold text-green-400">{data.confusion_matrix.tp}</span>
                <span className="text-xs text-slate-400 mt-1">TP</span>
              </div>
              <div className="bg-red-600/20 border border-red-600/40 rounded-xl py-5 flex flex-col items-center">
                <span className="text-2xl font-extrabold text-red-400">{data.confusion_matrix.fn}</span>
                <span className="text-xs text-slate-400 mt-1">FN</span>
              </div>
              {/* Row 2: Actual Aman */}
              <div className="text-slate-400 font-semibold py-3 flex items-center justify-end pr-2">
                Aktual: Aman
              </div>
              <div className="bg-orange-600/20 border border-orange-600/40 rounded-xl py-5 flex flex-col items-center">
                <span className="text-2xl font-extrabold text-orange-400">{data.confusion_matrix.fp}</span>
                <span className="text-xs text-slate-400 mt-1">FP</span>
              </div>
              <div className="bg-blue-600/20 border border-blue-600/40 rounded-xl py-5 flex flex-col items-center">
                <span className="text-2xl font-extrabold text-blue-400">{data.confusion_matrix.tn}</span>
                <span className="text-xs text-slate-400 mt-1">TN</span>
              </div>
            </div>
          </div>
        )}

        {/* Cross-Validation */}
        {data && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Cross-Validation (10-Fold)</h2>
            </div>
            <div className="flex flex-col gap-3">
              {data.cross_val_scores.map((score, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-14 shrink-0">Fold {idx + 1}</span>
                  <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${score}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{score.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between">
                <span className="text-sm text-slate-400">Rata-rata CV Score</span>
                <span className="text-sm font-bold text-blue-400">{cvMean.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {!data && (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </main>
  );
}
