"use client";

import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export default function Home() {
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    location: "",
  });
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🧠 Generate structured resume via API
  const handleGenerate = async () => {
    setLoading(true);
    setResumeData(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data = await res.json();
      setResumeData(data.resume);
    } catch (error) {
      console.error("Error generating resume:", error);
      alert("Something went wrong while generating your resume.");
    } finally {
      setLoading(false);
    }
  };

  // 🧾 Download as PDF (fixed spacing ✅)
  const handleDownloadPDF = () => {
    if (!resumeData) return alert("Generate your resume first!");

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    let y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(personalInfo.name || "Your Name", 15, y);
    y += 8;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}`,
      15,
      y
    );
    y += 6;
    pdf.text(`${personalInfo.linkedin} | ${personalInfo.github}`, 15, y);

    // ✅ FIXED version of addSection
    const addSection = (title: string, content: string[] | string) => {
      y += 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(title, 15, y);
      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);

      const lines = Array.isArray(content) ? content : [content];
      lines.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, 180);
        wrapped.forEach((ln: string) => {
          y += 6;
          pdf.text(ln, 15, y);
        });
      });

      y += 4; // gap between sections
    };

    addSection("Profile", resumeData.profile);

    if (resumeData.education?.length) {
      addSection(
        "Education",
        resumeData.education.map(
          (ed: any) =>
            `${ed.degree}, ${ed.institution} (${ed.year || ""})`
        )
      );
    }

    if (resumeData.experience?.length) {
      addSection(
        "Experience",
        resumeData.experience.flatMap(
          (exp: any) => [
            `${exp.title} - ${exp.company} (${exp.dates})`,
            ...(exp.details || []),
          ]
        )
      );
    }

    if (resumeData.skills?.length) {
      addSection("Skills", resumeData.skills);
    }

    if (resumeData.projects?.length) {
      addSection(
        "Projects",
        resumeData.projects.map(
          (p: any) => `${p.name}: ${p.description}`
        )
      );
    }

    if (resumeData.certificates?.length) {
      addSection("Certificates", resumeData.certificates);
    }

    pdf.save(`${personalInfo.name || "Resume"}.pdf`);
  };

  // 📝 Download as Word
  const handleDownloadWord = async () => {
    if (!resumeData) return alert("Generate your resume first!");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: personalInfo.name || "Your Name",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${personalInfo.linkedin} | ${personalInfo.github}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({ text: "" }),

            new Paragraph({
              text: "Profile",
              heading: "Heading2",
            }),
            new Paragraph({ text: resumeData.profile }),

            ...resumeData.education.map(
              (ed: any) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${ed.degree}, ${ed.institution} (${ed.year || ""})`,
                      size: 22,
                    }),
                  ],
                })
            ),

            ...resumeData.experience.flatMap((exp: any) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.title} - ${exp.company} (${exp.dates})`,
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              ...(exp.details || []).map(
                (d: string) =>
                  new Paragraph({
                    children: [new TextRun({ text: "• " + d, size: 22 })],
                  })
              ),
            ]),

            new Paragraph({
              text: "Skills",
              heading: "Heading2",
            }),
            new Paragraph({
              text: (resumeData.skills || []).join(", "),
            }),

            new Paragraph({
              text: "Projects",
              heading: "Heading2",
            }),
            ...resumeData.projects.map(
              (p: any) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${p.name}: ${p.description}`,
                      size: 22,
                    }),
                  ],
                })
            ),

            new Paragraph({
              text: "Certificates",
              heading: "Heading2",
            }),
            ...resumeData.certificates.map(
              (c: string) =>
                new Paragraph({
                  children: [new TextRun({ text: c, size: 22 })],
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${personalInfo.name || "Resume"}.docx`);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-4xl font-bold text-blue-400 mb-6 text-center">
        AI Resume Tailor
      </h1>

      {/* Personal Info */}
      <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-lg w-full max-w-4xl mb-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-blue-300">
          Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(personalInfo).map((key) => (
            <input
              key={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={(personalInfo as any)[key]}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, [key]: e.target.value })
              }
              className="p-3 rounded-lg bg-[#0a0a0a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>
      </div>

      {/* Resume + Job Description */}
      <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-lg w-full max-w-4xl border border-gray-700">
        <textarea
          placeholder="Paste your resume here..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#0a0a0a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
        />
        <textarea
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-[#0a0a0a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all"
        >
          {loading ? "Generating..." : "Generate Tailored Resume"}
        </button>
      </div>

      {/* Resume Preview */}
      {resumeData && (
        <div className="bg-white text-black mt-10 p-8 rounded-2xl shadow-xl w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Preview</h2>

          <div className="mb-3">
            <p className="font-bold text-lg">{personalInfo.name}</p>
            <p className="text-sm">
              {personalInfo.email} | {personalInfo.phone} | {personalInfo.location}
            </p>
            <p className="text-sm">
              {personalInfo.linkedin} | {personalInfo.github}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-md border-b mb-1">Profile</h3>
            <p className="text-sm text-gray-800 mb-3">{resumeData.profile}</p>

            {resumeData.education?.length > 0 && (
              <>
                <h3 className="font-semibold text-md border-b mb-1">Education</h3>
                {resumeData.education.map((ed: any, idx: number) => (
                  <p key={idx} className="text-sm">
                    {ed.degree}, {ed.institution} ({ed.year})
                  </p>
                ))}
              </>
            )}

            {resumeData.experience?.length > 0 && (
              <>
                <h3 className="font-semibold text-md border-b mb-1">Experience</h3>
                {resumeData.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="text-sm mb-2">
                    <p className="font-semibold">
                      {exp.title} - {exp.company} ({exp.dates})
                    </p>
                    <ul className="list-disc ml-5">
                      {exp.details?.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}

            {resumeData.skills?.length > 0 && (
              <>
                <h3 className="font-semibold text-md border-b mb-1">Skills</h3>
                <p className="text-sm text-gray-800 mb-3">
                  {resumeData.skills.join(", ")}
                </p>
              </>
            )}

            {resumeData.projects?.length > 0 && (
              <>
                <h3 className="font-semibold text-md border-b mb-1">Projects</h3>
                {resumeData.projects.map((p: any, idx: number) => (
                  <p key={idx} className="text-sm text-gray-800 mb-2">
                    <span className="font-semibold">{p.name}: </span>
                    {p.description}
                  </p>
                ))}
              </>
            )}

            {resumeData.certificates?.length > 0 && (
              <>
                <h3 className="font-semibold text-md border-b mb-1">Certificates</h3>
                <ul className="list-disc ml-5">
                  {resumeData.certificates.map((c: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-800">
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleDownloadPDF}
              className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
            >
              📄 Download as PDF
            </button>
            <button
              onClick={handleDownloadWord}
              className="bg-blue-400 hover:bg-blue-500 text-black font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
            >
              📝 Download as Word
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
