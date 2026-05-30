import React, { useEffect, useState } from "react";
import { api } from "../app/api";
import { useSessionStore } from "../app/store";
import { emptyQuestionDraft, validateQuestionDraft } from "../app/utils";
import { Button, Field, GlassPanel, HeroPanel, MessageBanner, Select, TextArea } from "../components/ui";

export function AdminCreateSessionPage() {
  const { adminToken, setSession, logout } = useSessionStore();
  const [title, setTitle] = useState("Cybersecurity Basics");
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState("");
  const [selectedSetDetail, setSelectedSetDetail] = useState(null);
  const [setForm, setSetForm] = useState({
    name: "",
    description: "",
    questions: []
  });
  const [questionDraft, setQuestionDraft] = useState(emptyQuestionDraft());
  const [error, setError] = useState("");
  const [questionSetError, setQuestionSetError] = useState("");

  useEffect(() => {
    if (!adminToken) window.location.hash = "#/admin";
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    loadQuestionSets();
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken || !selectedQuestionSetId) {
      setSelectedSetDetail(null);
      return;
    }

    api(`/api/question-sets/${selectedQuestionSetId}`, { token: adminToken })
      .then(({ questionSet }) => setSelectedSetDetail(questionSet))
      .catch((caught) => {
        if (caught.message === "Authentication required") {
          logout();
          window.location.hash = "#/admin";
          return;
        }
        setQuestionSetError(caught.message);
      });
  }, [adminToken, logout, selectedQuestionSetId]);

  async function loadQuestionSets() {
    try {
      const data = await api("/api/question-sets", { token: adminToken });
      setQuestionSets(data.questionSets);
      const defaultSet = data.questionSets.find((set) => set.isDefault) || data.questionSets[0];
      setSelectedQuestionSetId((current) => current || (defaultSet ? String(defaultSet.id) : ""));
    } catch (caught) {
      if (caught.message === "Authentication required") {
        logout();
        window.location.hash = "#/admin";
        return;
      }
      setQuestionSetError(caught.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/sessions", {
        method: "POST",
        token: adminToken,
        body: { title, questionSetId: selectedQuestionSetId ? Number(selectedQuestionSetId) : null }
      });
      setSession(data.session);
      window.location.hash = `#/admin/lobby/${data.session.id}`;
    } catch (caught) {
      setError(caught.message);
    }
  }

  function updateDraftOption(index, value) {
    setQuestionDraft((draft) => ({
      ...draft,
      options: draft.options.map((option, optionIndex) => (optionIndex === index ? value : option))
    }));
  }

  function addDraftQuestion() {
    setQuestionSetError("");
    const validationError = validateQuestionDraft(questionDraft);
    if (validationError) {
      setQuestionSetError(validationError);
      return;
    }

    setSetForm((form) => ({
      ...form,
      questions: [...form.questions, questionDraft]
    }));
    setQuestionDraft(emptyQuestionDraft());
  }

  async function saveQuestionSet(event) {
    event.preventDefault();
    setQuestionSetError("");
    if (!setForm.name.trim()) {
      setQuestionSetError("Question set name is required");
      return;
    }
    if (setForm.questions.length === 0) {
      setQuestionSetError("Add at least one question before saving the set");
      return;
    }

    try {
      const data = await api("/api/question-sets", {
        method: "POST",
        token: adminToken,
        body: setForm
      });
      setSetForm({ name: "", description: "", questions: [] });
      setQuestionDraft(emptyQuestionDraft());
      await loadQuestionSets();
      setSelectedQuestionSetId(String(data.questionSet.id));
      setSelectedSetDetail(data.questionSet);
    } catch (caught) {
      setQuestionSetError(caught.message);
    }
  }

  return (
    <div className="grid gap-6">
      <HeroPanel
        eyebrow="Session setup"
        title="Prepare the next cyber drill."
        description="Name the exercise, choose a reusable question set, and keep authoring separate from live operations."
      />

      <GlassPanel>
        <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Field label="Session title" value={title} onChange={setTitle} />
            <Select label="Question set" value={selectedQuestionSetId} onChange={setSelectedQuestionSetId}>
              <option value="">Choose a saved question set</option>
              {questionSets.map((questionSet) => (
                <option key={questionSet.id} value={questionSet.id}>
                  {questionSet.name} ({questionSet.questionCount})
                </option>
              ))}
            </Select>
            {error && <MessageBanner>{error}</MessageBanner>}
            <div className="flex flex-wrap gap-3">
              <Button>Create lobby</Button>
              <Button type="button" tone="secondary" onClick={logout}>
                Log out
              </Button>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Selected set</p>
            {selectedSetDetail ? (
              <>
                <h2 className="mt-3 text-xl font-semibold text-white">{selectedSetDetail.name}</h2>
                {selectedSetDetail.description && <p className="mt-2 text-zinc-400">{selectedSetDetail.description}</p>}
                <ul className="mt-4 grid gap-3">
                  {selectedSetDetail.questions.map((question) => (
                    <li key={question.id} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-zinc-300">
                      {question.title}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-zinc-500">Choose a saved question set to preview it here.</p>
            )}
          </div>
        </form>
      </GlassPanel>

      <GlassPanel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Reusable content</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Create question set</h2>
          </div>
          {setForm.questions.length > 0 && (
            <p className="text-sm text-zinc-400">{setForm.questions.length} questions staged for save</p>
          )}
        </div>
        <form onSubmit={saveQuestionSet} className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <Field label="Set name" value={setForm.name} onChange={(name) => setSetForm({ ...setForm, name })} />
            <TextArea
              label="Set description"
              value={setForm.description}
              onChange={(description) => setSetForm({ ...setForm, description })}
            />
            {setForm.questions.length > 0 && (
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Ready to save</p>
                <ol className="mt-4 grid gap-3">
                  {setForm.questions.map((question, index) => (
                    <li key={`${question.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-zinc-300">
                      {index + 1}. {question.title}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Field
              label="Question title"
              value={questionDraft.title}
              onChange={(title) => setQuestionDraft({ ...questionDraft, title })}
            />
            <TextArea
              label="Scenario description"
              value={questionDraft.scenario}
              onChange={(scenario) => setQuestionDraft({ ...questionDraft, scenario })}
              rows={4}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {questionDraft.options.map((option, index) => (
                <label key={index} className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={questionDraft.correctOptionIndex === index}
                      onChange={() => setQuestionDraft({ ...questionDraft, correctOptionIndex: index })}
                      aria-label={`Option ${index + 1} is correct`}
                      className="accent-cyan-300"
                    />
                    <span className="text-sm font-medium text-zinc-200">Option {index + 1}</span>
                  </div>
                  <input
                    value={option}
                    onChange={(event) => updateDraftOption(index, event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-100 outline-none transition duration-200 focus:border-cyan-300/50 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.08)]"
                  />
                </label>
              ))}
            </div>
            <TextArea
              label="Explanation"
              value={questionDraft.explanation}
              onChange={(explanation) => setQuestionDraft({ ...questionDraft, explanation })}
            />
            <TextArea
              label="Learning objective"
              value={questionDraft.learningObjective}
              onChange={(learningObjective) => setQuestionDraft({ ...questionDraft, learningObjective })}
            />
            <TextArea
              label="Recommended behavior"
              value={questionDraft.recommendedBehavior}
              onChange={(recommendedBehavior) => setQuestionDraft({ ...questionDraft, recommendedBehavior })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Category"
                value={questionDraft.category}
                onChange={(category) => setQuestionDraft({ ...questionDraft, category })}
              />
              <Field
                label="Difficulty"
                value={questionDraft.difficulty}
                onChange={(difficulty) => setQuestionDraft({ ...questionDraft, difficulty })}
              />
            </div>
            {questionSetError && <MessageBanner>{questionSetError}</MessageBanner>}
            <div className="flex flex-wrap gap-3">
              <Button type="button" tone="secondary" onClick={addDraftQuestion}>
                Add question to set
              </Button>
              <Button>Save question set</Button>
            </div>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
