import { useState, useEffect } from "react";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .team-row { transition: transform 0.15s ease; }
  .team-row:hover { transform: translateX(3px); }
  .tab-btn:hover { background: rgba(255,255,255,0.07) !important; }
`;

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://obrlhfpfiahedkvxtntl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmxoZnBmaWFoZWRrdnh0bnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTAyMTYsImV4cCI6MjA5NTY2NjIxNn0.RqghH_xfvWPpHRWtrqiT2ObF_OH13SFOgWUDlftPg7E";
const SB = { "Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Prefer":"return=representation" };
async function sbGet(table,params=""){const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`,{headers:SB});if(!res.ok)throw new Error(await res.text());return res.json();}
async function sbUpsert(table,data){const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",headers:{...SB,"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(data)});if(!res.ok)throw new Error(await res.text());return res.json();}
async function sbDelete(table,match){const params=Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");const res=await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`,{method:"DELETE",headers:SB});if(!res.ok)throw new Error(await res.text());}

// ─── Teams ────────────────────────────────────────────────────────────────────
const TEAMS = {
  baseball:[
    {id:"bb-juniors",name:"Juniors"},{id:"bb-12g",name:"12U Green"},{id:"bb-11g",name:"11U Green"},
    {id:"bb-11o",name:"11U Orange"},{id:"bb-10g",name:"10U Green"},{id:"bb-10o",name:"10U Orange"},
    {id:"bb-9g",name:"9U Green"},{id:"bb-9o",name:"9U Orange"},{id:"bb-8g",name:"8U Green"},{id:"bb-8o",name:"8U Orange"},
  ],
  softball:[
    {id:"sb-12g",name:"12U Green"},{id:"sb-10g",name:"10U Green"},{id:"sb-10o",name:"10U Orange"},{id:"sb-8g",name:"8U Green"},
  ],
};
const ALL_TEAMS=[...TEAMS.baseball,...TEAMS.softball];
// Admin password stored here — keep repo private
const ADMIN_PASSWORD="allstars2026";

// ─── Pre-populated bracket data from PDFs ─────────────────────────────────────
// Location shorthand
const WILSON="3238 Corbett Ave NE, Wilson NC";
const JOHNSTON="Johnston County LL";

const SEED_BRACKETS = [
  // ── 7-8 Baseball (Pool Play) ──
  {
    id:"bracket-7-8-bb",
    title:"7-8 Baseball (Minor/MP)",
    type:"pool-play",
    teamNames:["Supper Optimist Blue","S. Durham Orange","Johnston Co","Wilson","Supper Optimist Wht"],
    rounds:[
      {name:"Pool A – Sat Jun 13",games:[
        {team1:"Supper Optimist Blue",team2:"S. Durham Orange",date:"2026-06-13",time:"09:00",location:"Southern Bank Stadium"},
        {team1:"Johnston Co",team2:"Wilson",date:"2026-06-13",time:"11:00",location:"Southern Bank Stadium"},
        {team1:"Supper Optimist Blue",team2:"Johnston Co",date:"2026-06-13",time:"13:00",location:"Southern Bank Stadium"},
        {team1:"S. Durham Orange",team2:"Wilson",date:"2026-06-13",time:"13:00",location:"Gillette Field #3"},
      ]},
      {name:"Pool Play – Sun Jun 14",games:[
        {team1:"Supper Optimist Blue",team2:"Wilson",date:"2026-06-14",time:"09:00",location:"Gillette Field #1"},
        {team1:"S. Durham Orange",team2:"Johnston Co",date:"2026-06-14",time:"11:00",location:"Gillette Field #1"},
      ]},
      {name:"District Finals – Mon Jun 15",games:[
        {team1:"Semifinal Winner 1",team2:"Semifinal Winner 2",date:"2026-06-15",time:"20:00",location:"Southern Bank Stadium"},
      ]},
    ],
  },

  // ── 8-9 Baseball (KP) ──
  {
    id:"bracket-8-9-bb",
    title:"8-9 Baseball (KP)",
    type:"double-elim",
    teamNames:["Supper Optimist","Bull City","S. Durham Green","Wilson","S. Durham Orange"],
    rounds:[
      {name:"Round 1",bracket:"W",games:[
        {team1:"Supper Optimist",team2:"Bull City",date:"2026-06-20",time:"09:00",location:"Field #2, Wilson"},
        {team1:"Wilson",team2:"S. Durham Orange",date:"2026-06-19",time:"18:00",location:"Field #2, Wilson"},
        {team1:"S. Durham Green",team2:"BYE",date:"2026-06-20",time:"11:00",location:"Field #2, Wilson"},
      ]},
      {name:"Winners Semi",bracket:"W",games:[
        {team1:"W Gm2 Winner",team2:"W Gm3 Winner",date:"2026-06-21",time:"11:00",location:"Field #3, Wilson"},
        {team1:"W Gm1 Winner",team2:"TBD",date:"2026-06-21",time:"09:00",location:"Field #2, Wilson"},
      ]},
      {name:"Winners Final",bracket:"W",games:[
        {team1:"Winners Semi Winner",team2:"TBD",date:"2026-06-24",time:"20:00",location:"Southern Bank Stadium"},
      ]},
      {name:"Losers R1",bracket:"L",games:[
        {team1:"L Gm2",team2:"L Gm1",date:"2026-06-21",time:"09:00",location:"Field #2, Wilson"},
        {team1:"L Gm3",team2:"TBD",date:"2026-06-22",time:"18:00",location:"Field #3, Wilson"},
      ]},
      {name:"Losers Final",bracket:"L",games:[
        {team1:"Losers R1 Winner",team2:"TBD",date:"2026-06-23",time:"18:00",location:"SBS, Wilson"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Winners Finalist",team2:"Losers Finalist",date:"2026-06-25",time:"20:00",location:"Southern Bank Stadium"},
        {team1:"If Necessary (L8)",team2:"TBD",date:"2026-06-25",time:"TBD",location:"Southern Bank Stadium"},
      ]},
    ],
  },

  // ── 8-10 Baseball (Minor) ──
  {
    id:"bracket-8-10-bb",
    title:"8-10 Baseball (Minor)",
    type:"double-elim",
    teamNames:["Morrisville","S. Durham Green","Bull City","Supper Optimist","Person Co","S. Durham Orange","S. Durham Green B","Johnston Co Red","Wilson"],
    rounds:[
      {name:"Round 1 – Fri Jun 19",bracket:"W",games:[
        {team1:"Johnston Co Red",team2:"Wilson",date:"2026-06-19",time:"18:00",location:"SBS, Wilson"},
      ]},
      {name:"Round 2 – Sat Jun 20",bracket:"W",games:[
        {team1:"Morrisville",team2:"S. Durham Green",date:"2026-06-20",time:"09:00",location:"Southern Bank Stadium"},
        {team1:"Bull City",team2:"Supper Optimist",date:"2026-06-20",time:"11:00",location:"Southern Bank Stadium"},
        {team1:"Person Co",team2:"W Gm1 (T8/T9)",date:"2026-06-20",time:"13:00",location:"Field #2, Wilson"},
        {team1:"S. Durham Orange",team2:"S. Durham Green B",date:"2026-06-20",time:"13:00",location:"Southern Bank Stadium"},
      ]},
      {name:"Winners Quarters",bracket:"W",games:[
        {team1:"W Gm2",team2:"W Gm3",date:"2026-06-22",time:"20:00",location:"Southern Bank Stadium"},
        {team1:"W Gm4",team2:"W Gm5",date:"2026-06-22",time:"20:00",location:"Field #2, Wilson"},
      ]},
      {name:"Losers R1",bracket:"L",games:[
        {team1:"L Gm2",team2:"L Gm1",date:"2026-06-21",time:"13:00",location:"Field 2, Wilson"},
        {team1:"L Gm5",team2:"L Gm4",date:"2026-06-22",time:"18:00",location:"Southern Bank Stadium"},
        {team1:"L Gm3",team2:"TBD",date:"2026-06-22",time:"18:00",location:"Field #2, Wilson"},
      ]},
      {name:"Winners Semi",bracket:"W",games:[
        {team1:"W Quarters Winner 1",team2:"W Quarters Winner 2",date:"2026-06-24",time:"18:00",location:"Southern Bank Stadium"},
      ]},
      {name:"Losers Semi",bracket:"L",games:[
        {team1:"L R1 Winner 1",team2:"L R1 Winner 2",date:"2026-06-23",time:"20:00",location:"Southern Bank Stadium"},
        {team1:"Losers Semi Winner",team2:"TBD",date:"2026-06-24",time:"18:00",location:"Field #2, Wilson"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Winners Finalist",team2:"Losers Finalist",date:"2026-06-26",time:"16:00",location:"Southern Bank Stadium"},
        {team1:"If Necessary",team2:"TBD",date:"2026-06-27",time:"16:00",location:"Southern Bank Stadium"},
      ]},
    ],
  },

  // ── 9-11 Baseball ──
  {
    id:"bracket-9-11-bb",
    title:"9-11 Baseball",
    type:"double-elim",
    teamNames:["Wilson","Bull City","Supper Optimist","Johnston Co","S. Durham Green","S. Durham Orange"],
    rounds:[
      {name:"Round 1",bracket:"W",games:[
        {team1:"Supper Optimist",team2:"Johnston Co",date:"2026-06-26",time:"18:00",location:"Field #2, Wilson"},
        {team1:"S. Durham Green",team2:"S. Durham Orange",date:"2026-06-26",time:"18:00",location:"Field #3, Wilson"},
      ]},
      {name:"Winners Semi",bracket:"W",games:[
        {team1:"Wilson",team2:"W Gm: Supper/Johnston",date:"2026-06-27",time:"10:00",location:"Field #2, Wilson"},
        {team1:"Bull City",team2:"W Gm: S.Durham Gn/Or",date:"2026-06-27",time:"12:00",location:"Field #2, Wilson"},
      ]},
      {name:"Losers R1",bracket:"L",games:[
        {team1:"L Gm1",team2:"L Gm2",date:"2026-06-28",time:"09:00",location:"Field #2, Wilson"},
        {team1:"L Gm3",team2:"L Gm4",date:"2026-06-28",time:"11:00",location:"Field #2, Wilson"},
      ]},
      {name:"Winners Final",bracket:"W",games:[
        {team1:"W Semi Winner 1",team2:"W Semi Winner 2",date:"2026-06-28",time:"11:00",location:"Field #2, Wilson"},
      ]},
      {name:"Losers Semi",bracket:"L",games:[
        {team1:"L R1 Winner 1",team2:"L R1 Winner 2",date:"2026-06-30",time:"18:00",location:"SBS, Wilson"},
        {team1:"L7 Winner",team2:"TBD",date:"2026-06-30",time:"18:00",location:"SBS, Wilson"},
      ]},
      {name:"Losers Final",bracket:"L",games:[
        {team1:"Losers Semi Winner",team2:"TBD",date:"2026-07-01",time:"18:00",location:"SBS, Wilson"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Winners Finalist",team2:"Losers Finalist",date:"2026-07-02",time:"18:00",location:"SBS, Wilson"},
        {team1:"If Necessary (L10)",team2:"TBD",date:"2026-07-02",time:"TBD",location:"SBS, Wilson"},
      ]},
    ],
  },

  // ── 10-12 Baseball (Major) ──
  {
    id:"bracket-10-12-bb",
    title:"10-12 Baseball (Major)",
    type:"double-elim",
    teamNames:["Morrisville","S. Durham","Johnston Co","Supper Optimist","S. Durham Green","S. Durham Orange","Bull City"],
    rounds:[
      {name:"Round 1",bracket:"W",games:[
        {team1:"S. Durham",team2:"Johnston Co",date:"2026-06-26",time:"18:00",location:"SBS, Wilson"},
        {team1:"Supper Optimist",team2:"S. Durham Green",date:"2026-06-26",time:"20:00",location:"Field #2, Wilson"},
        {team1:"S. Durham Orange",team2:"Bull City",date:"2026-06-26",time:"20:00",location:"SBS, Wilson"},
      ]},
      {name:"Winners Semi",bracket:"W",games:[
        {team1:"Morrisville",team2:"W Gm: S.Durham/Johnston",date:"2026-06-27",time:"10:00",location:"SBS, Wilson"},
        {team1:"W Gm: Supper/S.DurhamGn",team2:"W Gm: S.DurhamOr/BullCity",date:"2026-06-27",time:"12:00",location:"SBS, Wilson"},
      ]},
      {name:"Losers R1",bracket:"L",games:[
        {team1:"L Gm4",team2:"L Gm5",date:"2026-06-27",time:"14:00",location:"SBS, Wilson"},
        {team1:"L Gm1",team2:"L Gm2",date:"2026-06-27",time:"14:00",location:"SBS, Wilson"},
        {team1:"L Gm6",team2:"TBD",date:"2026-06-28",time:"11:00",location:"SBS, Wilson"},
      ]},
      {name:"Winners Final",bracket:"W",games:[
        {team1:"W Semi Winner 1",team2:"W Semi Winner 2",date:"2026-06-28",time:"13:00",location:"SBS, Wilson"},
      ]},
      {name:"Losers Semi",bracket:"L",games:[
        {team1:"L R1 Winner 1",team2:"L R1 Winner 2",date:"2026-06-29",time:"20:00",location:"SBS, Wilson"},
        {team1:"Losers Semi Winner",team2:"TBD",date:"2026-06-30",time:"20:00",location:"SBS, Wilson"},
      ]},
      {name:"Losers Final",bracket:"L",games:[
        {team1:"Losers Semi Winner",team2:"TBD",date:"2026-07-01",time:"20:00",location:"SBS, Wilson"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Winners Finalist",team2:"Losers Finalist",date:"2026-07-02",time:"18:00",location:"SBS, Wilson"},
        {team1:"If Necessary",team2:"TBD",date:"2026-07-02",time:"TBD",location:"SBS, Wilson"},
      ]},
    ],
  },

  // ── 7-8 Softball (CP) ──
  {
    id:"bracket-7-8-sb",
    title:"7-8 Softball (CP)",
    type:"double-elim",
    teamNames:["S. Durham Green","Wilmington","S. Durham Orange","Johnston Co"],
    rounds:[
      {name:"Round 1",bracket:"W",games:[
        {team1:"S. Durham Green",team2:"Wilmington",date:"2026-06-20",time:"09:00",location:"Field 1, Johnston Co LL"},
        {team1:"S. Durham Orange",team2:"Johnston Co",date:"2026-06-20",time:"09:00",location:"Field 2, Johnston Co LL"},
        {team1:"W Gm1",team2:"W Gm2",date:"2026-06-20",time:"11:00",location:"Field 2, Johnston Co LL"},
        {team1:"L Gm1",team2:"L Gm2",date:"2026-06-20",time:"11:00",location:"Field 1, Johnston Co LL"},
      ]},
      {name:"Semi / Losers",bracket:"L",games:[
        {team1:"W Gm3 Winner",team2:"L Bracket Winner",date:"2026-06-21",time:"10:00",location:"Field 1, Johnston Co LL"},
        {team1:"Loser Gm3",team2:"L Gm4 Winner",date:"2026-06-21",time:"12:00",location:"Field 2, Johnston Co LL"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Finals Winner",team2:"TBD",date:"2026-06-21",time:"TBD",location:"Johnston Co LL"},
        {team1:"If Necessary (Gm 7)",team2:"TBD",date:"2026-06-22",time:"18:00",location:"Field 2, Johnston Co LL"},
      ]},
    ],
  },

  // ── 8-10 Softball ──
  {
    id:"bracket-8-10-sb",
    title:"8-10 Softball",
    type:"double-elim",
    teamNames:["Bull City","S. Durham Green","S. Durham Orange","Johnston Co"],
    rounds:[
      {name:"Round 1",bracket:"W",games:[
        {team1:"Bull City",team2:"S. Durham Green",date:"2026-06-19",time:"17:00",location:"Field 1, Johnston Co LL"},
        {team1:"S. Durham Orange",team2:"Johnston Co",date:"2026-06-19",time:"19:00",location:"Field 1, Johnston Co LL"},
      ]},
      {name:"Round 2",bracket:"W",games:[
        {team1:"W Gm1",team2:"W Gm2",date:"2026-06-20",time:"13:00",location:"Field 1, Johnston Co LL"},
        {team1:"L Gm1",team2:"L Gm2",date:"2026-06-20",time:"15:00",location:"Field 1, Johnston Co LL"},
        {team1:"W Gm3",team2:"L Gm3/4 Winner",date:"2026-06-20",time:"17:00",location:"Field 1, Johnston Co LL"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Winners Finalist",team2:"Losers Finalist",date:"2026-06-21",time:"10:00",location:"Field 2, Johnston Co LL"},
        {team1:"If Necessary (Gm 7)",team2:"TBD",date:"2026-06-21",time:"12:00",location:"Field 1, Johnston Co LL"},
      ]},
    ],
  },

  // ── 10-12 Softball ──
  {
    id:"bracket-10-12-sb",
    title:"10-12 Softball",
    type:"double-elim",
    teamNames:["Bull City","S. Durham","Johnston Co"],
    rounds:[
      {name:"Round 1",bracket:"W",games:[
        {team1:"S. Durham",team2:"Johnston Co",date:"2026-06-19",time:"18:00",location:"Field 2, Johnston Co LL"},
      ]},
      {name:"Round 2",bracket:"W",games:[
        {team1:"Bull City",team2:"W Gm1",date:"2026-06-20",time:"14:00",location:"Field 2, Johnston Co LL"},
        {team1:"L Gm1",team2:"L Gm2",date:"2026-06-20",time:"16:00",location:"Field 2, Johnston Co LL"},
      ]},
      {name:"Semi",bracket:"L",games:[
        {team1:"W Gm2 Winner",team2:"L Bracket Winner",date:"2026-06-21",time:"14:00",location:"Field 2, Johnston Co LL"},
      ]},
      {name:"Championship",bracket:"C",games:[
        {team1:"Finals Winner",team2:"TBD",date:"2026-06-21",time:"TBD",location:"Johnston Co LL"},
        {team1:"If Necessary (Gm 5)",team2:"TBD",date:"2026-06-21",time:"TBD",location:"Johnston Co LL"},
      ]},
    ],
  },
];

// ─── Pre-populated SDLL team schedules from PDFs ──────────────────────────────
// Keyed by team ID — games pulled from bracket PDFs where SDLL teams appear
const SEED_SCHEDULES = {
  // 8-9 BB: S. Durham Green = Team 3 (bye R1), S. Durham Orange = Team 5
  "bb-9g":[
    {id:9001,teamId:"bb-9g",opponent:"BYE (advances to Winners Semi)",date:"2026-06-20",time:"11:00",location:"Field #2, Wilson NC"},
    {id:9002,teamId:"bb-9g",opponent:"TBD (Winners Semi)",date:"2026-06-21",time:"11:00",location:"Field #3, Wilson NC"},
  ],
  "bb-9o":[
    {id:9003,teamId:"bb-9o",opponent:"Wilson",date:"2026-06-19",time:"18:00",location:"Field #2, Wilson NC"},
    {id:9004,teamId:"bb-9o",opponent:"TBD (Winners Semi or Losers)",date:"2026-06-21",time:"09:00",location:"Field #2, Wilson NC"},
  ],
  // 9-11 BB: S. Durham Green = Team 1, S. Durham Orange = Team 6, Person Co, Bull City, Morrisville, Johnston Co
  "bb-11g":[
    {id:9011,teamId:"bb-11g",opponent:"W Gm: Supper Optimist / Johnston Co",date:"2026-06-27",time:"10:00",location:"Field #2, Wilson NC"},
  ],
  "bb-11o":[
    {id:9012,teamId:"bb-11o",opponent:"S. Durham Green",date:"2026-06-26",time:"18:00",location:"Field #3, Wilson NC"},
    {id:9013,teamId:"bb-11o",opponent:"TBD (Sat Jun 27)",date:"2026-06-27",time:"12:00",location:"Field #2, Wilson NC"},
  ],
  // 10-12 BB: S. Durham = Team 2, S. Durham Orange = Team 6
  "bb-12g":[
    {id:9021,teamId:"bb-12g",opponent:"Johnston Co",date:"2026-06-26",time:"18:00",location:"SBS, Wilson NC"},
    {id:9022,teamId:"bb-12g",opponent:"TBD (Winners Semi)",date:"2026-06-27",time:"TBD",location:"SBS, Wilson NC"},
  ],
  "bb-12o":[
    {id:9023,teamId:"bb-12g",opponent:"Team 7 (TBD)",date:"2026-06-26",time:"20:00",location:"SBS, Wilson NC"},
  ],
  // 7-8 BB: S. Durham Orange = Team 2
  "bb-8o":[
    {id:9031,teamId:"bb-8o",opponent:"Supper Optimist Blue",date:"2026-06-13",time:"09:00",location:"Southern Bank Stadium, Wilson NC"},
    {id:9032,teamId:"bb-8o",opponent:"Wilson",date:"2026-06-13",time:"13:00",location:"Gillette Field #3, Wilson NC"},
    {id:9033,teamId:"bb-8o",opponent:"Johnston Co",date:"2026-06-14",time:"11:00",location:"Gillette Field #1, Wilson NC"},
  ],
  // 7-8 SB: S. Durham Green = Team 1, S. Durham Orange = Team 3
  "sb-8g":[
    {id:9041,teamId:"sb-8g",opponent:"Wilmington",date:"2026-06-20",time:"09:00",location:"Field 1, Johnston Co LL"},
    {id:9042,teamId:"sb-8g",opponent:"TBD (Gm 3)",date:"2026-06-20",time:"11:00",location:"Field 2, Johnston Co LL"},
  ],
  // 8-10 SB: S. Durham Green = Team 2, S. Durham Orange = Team 3
  "sb-10g":[
    {id:9051,teamId:"sb-10g",opponent:"Bull City",date:"2026-06-19",time:"17:00",location:"Field 1, Johnston Co LL"},
    {id:9052,teamId:"sb-10g",opponent:"W Gm: Bull City / S.Durham Green",date:"2026-06-20",time:"13:00",location:"Field 1, Johnston Co LL"},
  ],
  "sb-10o":[
    {id:9053,teamId:"sb-10o",opponent:"Johnston Co",date:"2026-06-19",time:"19:00",location:"Field 1, Johnston Co LL"},
    {id:9054,teamId:"sb-10o",opponent:"TBD (Gm 3 or Losers)",date:"2026-06-20",time:"15:00",location:"Field 1, Johnston Co LL"},
  ],
  // 10-12 SB: S. Durham = Team 2
  "sb-12g":[
    {id:9061,teamId:"sb-12g",opponent:"Johnston Co",date:"2026-06-19",time:"18:00",location:"Field 2, Johnston Co LL"},
    {id:9062,teamId:"sb-12g",opponent:"TBD (Gm 2)",date:"2026-06-20",time:"14:00",location:"Field 2, Johnston Co LL"},
  ],
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const C={
  green:"#2D6A2D",greenGlow:"rgba(45,106,45,0.3)",greenText:"#6fcf6f",
  orange:"#E85D04",orangeGlow:"rgba(232,93,4,0.2)",orangeText:"#ff8c4a",
  dark:"#0d0d0d",darker:"#080808",card:"rgba(20,20,20,0.97)",
  cardHover:"rgba(30,30,30,0.97)",border:"rgba(255,255,255,0.07)",
  borderActive:"rgba(232,93,4,0.4)",textPrimary:"#fff",
  textSecondary:"rgba(255,255,255,0.55)",textMuted:"rgba(255,255,255,0.25)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const defaultRecords=()=>{const r={};ALL_TEAMS.forEach(t=>{r[t.id]={w:0,l:0};});return r;};
function pct(w,l){const t=w+l;if(!t)return"—";const p=w/t;return p===1?"1.000":p.toFixed(3).replace(/^0/,"");}
function formatDate(d){if(!d)return"";const[,m,day]=d.split("-");return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]} ${parseInt(day)}`;}
function formatDateTime(d,t){const ds=formatDate(d);if(!t||t==="TBD"||!t.includes(":"))return t&&t!=="TBD"?`${ds} · ${t}`:ds;const[h,min]=t.split(":");const hour=parseInt(h);if(isNaN(hour))return ds;return`${ds} · ${hour%12||12}:${min} ${hour>=12?"PM":"AM"}`;}

// ─── Small UI ─────────────────────────────────────────────────────────────────
function ColHead({children,style={}}){return<span style={{fontSize:19,fontWeight:700,letterSpacing:2,color:C.textMuted,textTransform:"uppercase",fontFamily:"'Barlow Condensed', sans-serif",...style}}>{children}</span>;}
function WLBadge({result}){const win=result==="W";return<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:20,borderRadius:3,background:win?"rgba(45,106,45,0.4)":"rgba(232,93,4,0.3)",border:`1px solid ${win?"rgba(45,106,45,0.6)":"rgba(232,93,4,0.5)"}`,color:win?C.greenText:C.orangeText,fontWeight:700,fontSize:19,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>{result}</span>;}
function StatBadge({value,type}){const active=value>0,isW=type==="w";return<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:28,borderRadius:4,background:active?(isW?C.greenGlow:C.orangeGlow):"rgba(255,255,255,0.04)",border:`1px solid ${active?(isW?"rgba(45,106,45,0.5)":"rgba(232,93,4,0.4)"):"transparent"}`,color:active?(isW?C.greenText:C.orangeText):C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,fontSize:18}}>{value}</span>;}
function FormCard({title,children}){return<div style={{background:"rgba(18,18,18,0.98)",borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:24}}><div style={{background:`linear-gradient(90deg,${C.green},#1e4d1e)`,borderBottom:`3px solid ${C.orange}`,padding:"12px 20px"}}><span style={{color:C.textPrimary,fontWeight:700,fontSize:23,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>{title}</span></div><div style={{padding:20}}>{children}</div></div>;}
function SectionLabel({children}){return<div style={{color:C.orange,fontSize:21,letterSpacing:2,textTransform:"uppercase",margin:"0 0 10px",fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif"}}>{children}</div>;}
function Label({children}){return<label style={{display:"block",fontSize:19,letterSpacing:2,textTransform:"uppercase",color:C.textMuted,marginBottom:5,fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif"}}>{children}</label>;}
function TeamSelect({value,onChange}){return<select value={value} onChange={e=>onChange(e.target.value)} style={inputStyle}><optgroup label="⚾ Baseball">{TEAMS.baseball.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</optgroup><optgroup label="🥎 Softball">{TEAMS.softball.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</optgroup></select>;}

// ─── Bracket Display ──────────────────────────────────────────────────────────
// ─── Bracket Components ──────────────────────────────────────────────────────

// Build a flat game list with sequential numbers across all rounds
function buildGameIndex(rounds) {
  let num = 1;
  const index = {}; // "ri-gi" -> gameNum
  rounds.forEach((r, ri) => {
    r.games.forEach((g, gi) => {
      index[`${ri}-${gi}`] = num++;
    });
  });
  return index;
}

// Resolve a team name: if it looks like a "W Gm X" or "L Gm X" reference,
// look up the actual winner/loser from played games
function resolveTeam(name, rounds, gameIndex) {
  if (!name || name === "TBD" || name === "BYE") return name;
  // Match patterns like "W Gm2 Winner", "W Game 2", "L Gm3", "L Game 3"
  const wMatch = name.match(/^W\s*(?:Gm|Game)\s*(\d+)/i);
  const lMatch = name.match(/^L\s*(?:Gm|Game)\s*(\d+)/i);
  const targetNum = wMatch ? parseInt(wMatch[1]) : lMatch ? parseInt(lMatch[1]) : null;
  if (!targetNum) return name;
  // Find the game with that number
  for (const [key, num] of Object.entries(gameIndex)) {
    if (num === targetNum) {
      const [ri, gi] = key.split("-").map(Number);
      const game = rounds[ri]?.games[gi];
      if (!game) return name;
      const t1 = game.team1 || "TBD", t2 = game.team2 || "TBD";
      const hasResult = game.score1 !== undefined && game.score2 !== undefined;
      if (!hasResult) {
        // Show the two possible teams as context
        const c1 = resolveTeam(t1, rounds, gameIndex);
        const c2 = resolveTeam(t2, rounds, gameIndex);
        if (c1 !== "TBD" && c2 !== "TBD" && c1 !== "BYE" && c2 !== "BYE") {
          return wMatch ? `W: ${c1} / ${c2}` : `L: ${c1} / ${c2}`;
        }
        return name;
      }
      const winner = game.score1 > game.score2 ? t1 : t2;
      const loser  = game.score1 > game.score2 ? t2 : t1;
      return wMatch ? winner : loser;
    }
  }
  return name;
}

function BracketGameCard({game, gameNum, roundIndex, gameIndex, allRounds, onUpdate, isAdmin, isChamp}) {
  const [editing, setEditing] = useState(false);
  const [s1, setS1] = useState(""); const [s2, setS2] = useState("");

  const rawT1 = game.team1 || "TBD", rawT2 = game.team2 || "TBD";
  const t1 = resolveTeam(rawT1, allRounds, gameIndex);
  const t2 = resolveTeam(rawT2, allRounds, gameIndex);
  const isBye1 = t1 === "BYE", isBye2 = t2 === "BYE";
  const hasResult = game.score1 !== undefined && game.score2 !== undefined;
  const winner = hasResult ? (game.score1 > game.score2 ? t1 : t2) : (isBye1 ? t2 : isBye2 ? t1 : null);
  const isResolved1 = t1 !== rawT1 && !hasResult;
  const isResolved2 = t2 !== rawT2 && !hasResult;
  const canEnter = isAdmin && onUpdate && !hasResult && t1 !== "TBD" && t2 !== "TBD" && !isBye1 && !isBye2 && !t1.startsWith("W:") && !t1.startsWith("L:");

  const teamRow = (team, score, isBye, isResolved) => {
    const isWinner = winner === team;
    return (
      <div style={{
        display:"flex", alignItems:"center", padding:"9px 10px",
        background: isBye ? "rgba(255,255,255,0.02)" : isWinner ? "rgba(45,106,45,0.15)" : "transparent",
        minHeight: 38,
      }}>
        <span style={{
          flex:1, fontSize:14, fontWeight: isWinner ? 700 : 400,
          color: isBye ? C.textMuted : isWinner ? C.greenText : isResolved ? "rgba(255,255,255,0.7)" : C.textPrimary,
          fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:0.3,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          fontStyle: isBye || isResolved ? "italic" : "normal",
          fontSize: isResolved ? 12 : 14,
        }}>{team}</span>
        {hasResult && !isBye && (
          <span style={{
            fontSize:16, fontWeight:700, minWidth:22, textAlign:"right",
            color: isWinner ? C.greenText : C.textMuted,
            fontFamily:"'Barlow Condensed', sans-serif",
          }}>{score}</span>
        )}
        {isBye && <span style={{fontSize:11,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>BYE</span>}
        {isWinner && !isBye && <span style={{marginLeft:6,fontSize:11,color:C.greenText}}>✓</span>}
      </div>
    );
  };

  return (
    <div style={{
      background:"rgba(15,15,15,0.98)",
      border:`1px solid ${isChamp ? C.orange : hasResult ? "rgba(45,106,45,0.3)" : C.border}`,
      borderRadius:6, overflow:"hidden",
      boxShadow: hasResult ? "0 0 8px rgba(45,106,45,0.15)" : "none",
    }}>
      {/* Game number badge */}
      <div style={{
        background: isChamp ? `linear-gradient(90deg,${C.orange},${C.orangeText})` : "rgba(255,255,255,0.04)",
        padding:"3px 10px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:`1px solid ${C.border}`,
      }}>
        <span style={{
          fontSize:11, fontWeight:700, letterSpacing:2,
          color: isChamp ? "#fff" : C.textMuted,
          fontFamily:"'Barlow Condensed', sans-serif", textTransform:"uppercase",
        }}>Game {gameNum}</span>
        {hasResult && <span style={{fontSize:10,color:C.greenText,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1}}>FINAL</span>}
      </div>

      {/* Teams */}
      {teamRow(t1, game.score1, isBye1, isResolved1)}
      <div style={{height:1, background:C.border}}/>
      {teamRow(t2, game.score2, isBye2, isResolved2)}

      {/* Date/location */}
      {(game.date || game.location) && (
        <div style={{
          padding:"4px 10px 5px", background:"rgba(255,255,255,0.02)",
          fontSize:11, color:C.textMuted, fontFamily:"'Barlow', sans-serif",
          borderTop:`1px solid ${C.border}`,
        }}>
          {game.date && formatDateTime(game.date, game.time)}
          {game.date && game.location && " · "}
          {game.location}
        </div>
      )}

      {/* Admin score entry */}
      {canEnter && (
        !editing
          ? <button onClick={()=>setEditing(true)} style={{width:"100%",background:"rgba(232,93,4,0.08)",border:"none",borderTop:`1px solid ${C.border}`,color:C.orange,fontSize:12,padding:"6px",cursor:"pointer",fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1}}>+ ENTER SCORE</button>
          : <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,background:"rgba(255,255,255,0.02)"}}>
              <div style={{fontSize:11,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",marginBottom:6,letterSpacing:1}}>
                {t1} vs {t2}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="number" min="0" value={s1} onChange={e=>setS1(e.target.value)}
                  style={{width:"38%",padding:"5px 6px",borderRadius:4,border:`1px solid ${C.border}`,background:"#1a1a1a",color:"#fff",fontSize:16,fontWeight:700,textAlign:"center",fontFamily:"'Barlow Condensed', sans-serif"}}/>
                <span style={{color:C.textMuted,fontSize:13,fontWeight:700}}>–</span>
                <input type="number" min="0" value={s2} onChange={e=>setS2(e.target.value)}
                  style={{width:"38%",padding:"5px 6px",borderRadius:4,border:`1px solid ${C.border}`,background:"#1a1a1a",color:"#fff",fontSize:16,fontWeight:700,textAlign:"center",fontFamily:"'Barlow Condensed', sans-serif"}}/>
                <button onClick={()=>{if(s1===""||s2==="")return;onUpdate(roundIndex,gameIndex,parseInt(s1),parseInt(s2));setEditing(false);setS1("");setS2("");}}
                  style={{flex:1,background:C.green,border:"none",color:"#fff",borderRadius:4,padding:"6px 4px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif"}}>✓</button>
                <button onClick={()=>setEditing(false)}
                  style={{background:"transparent",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:4,padding:"6px 8px",cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            </div>
      )}
    </div>
  );
}

// Visual bracket with SVG connector lines
function BracketSection({rounds, allRounds, gameIndex, onUpdateGame, isAdmin, accentColor}) {
  // CARD_H: game-number header(26) + team row(38) + divider(1) + team row(38) + date row(25) = ~128px
  const CARD_H = 128;
  const CARD_GAP = 16;
  const CARD_W = 210;
  const COL_GAP = 44;
  // HEADER_H: round label(32) + marginBottom(12) = 44
  const HEADER_H = 44;
  const isChampRound = r => r.bracket==="C" || r.name.toLowerCase().includes("championship");

  // y-center of each card in a column (relative to top of column including header)
  function cardCenters(n) {
    return Array.from({length: n}, (_, gi) => HEADER_H + gi * (CARD_H + CARD_GAP) + CARD_H / 2);
  }

  function colHeight(n) {
    return HEADER_H + n * CARD_H + Math.max(0, n - 1) * CARD_GAP;
  }

  return (
    <div style={{overflowX:"auto", paddingBottom:8}}>
      <div style={{display:"flex", alignItems:"flex-start", gap:0, minWidth: rounds.length * (CARD_W + COL_GAP)}}>
        {rounds.map((round, ri) => {
          const globalRi = allRounds.indexOf(round);
          const isChamp = isChampRound(round);

          return (
            <div key={ri} style={{display:"flex", alignItems:"flex-start", flexShrink:0}}>
              {/* Column */}
              <div style={{width: CARD_W}}>
                {/* Round header */}
                <div style={{
                  background: isChamp ? C.orange : accentColor || C.green,
                  color:"#fff", padding:"7px 10px", fontSize:11, fontWeight:700,
                  letterSpacing:2, textTransform:"uppercase", textAlign:"center",
                  borderRadius:4, marginBottom:12,
                  fontFamily:"'Barlow Condensed', sans-serif",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                }}>{round.name}</div>

                {/* Games */}
                <div style={{display:"flex", flexDirection:"column", gap:CARD_GAP}}>
                  {round.games.map((game, gi) => (
                    <BracketGameCard
                      key={gi}
                      game={game}
                      gameNum={gameIndex[`${globalRi}-${gi}`]}
                      roundIndex={globalRi}
                      gameIndex={gi}
                      allRounds={allRounds}
                      isAdmin={isAdmin}
                      isChamp={isChamp}
                      onUpdate={isAdmin && onUpdateGame ? onUpdateGame : null}
                    />
                  ))}
                </div>
              </div>

              {/* SVG connector lines between rounds */}
              {ri < rounds.length - 1 && (() => {
                const nextRound = rounds[ri + 1];
                const currN = round.games.length;
                const nextN = nextRound.games.length;
                const svgH = Math.max(colHeight(currN), colHeight(nextN)) + 20;

                const currYs = cardCenters(currN);
                const nextYs = cardCenters(nextN);

                const lines = [];
                currYs.forEach((cy, i) => {
                  // When reducing rounds (e.g. 4->2), pair consecutive games
                  const ratio = currN / Math.max(nextN, 1);
                  const targetIdx = Math.min(Math.floor(i / ratio), nextN - 1);
                  const ny = nextYs[targetIdx] !== undefined ? nextYs[targetIdx] : nextYs[nextYs.length - 1];
                  const mx = COL_GAP / 2;
                  lines.push(
                    <path key={i}
                      d={`M 0 ${cy} H ${mx} V ${ny} H ${COL_GAP}`}
                      stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none" strokeLinejoin="round"
                    />
                  );
                });

                return (
                  <svg width={COL_GAP} height={svgH} style={{flexShrink:0, overflow:"visible"}}>
                    {lines}
                  </svg>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketView({bracket, onUpdateGame, isAdmin}) {
  if (!bracket || !bracket.rounds) return null;

  const isLoserRound = r =>
    r.bracket === "L" ||
    r.name.toLowerCase().includes("loser") ||
    r.name.toLowerCase().includes("elim");

  const winnersRounds = bracket.rounds.filter(r => !isLoserRound(r));
  const losersRounds  = bracket.rounds.filter(r =>  isLoserRound(r));
  const hasSplit = losersRounds.length > 0;
  const gameIndex = buildGameIndex(bracket.rounds);

  const sharedProps = {allRounds: bracket.rounds, gameIndex, isAdmin, onUpdateGame};

  if (!hasSplit) {
    return (
      <BracketSection rounds={bracket.rounds} {...sharedProps} />
    );
  }

  return (
    <div style={{paddingBottom:16}}>
      {/* Winners on top */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:3,color:C.greenText,textTransform:"uppercase",fontFamily:"'Barlow Condensed', sans-serif",marginBottom:10,paddingLeft:2}}>
          ▲ Winners Bracket
        </div>
        <BracketSection rounds={winnersRounds} {...sharedProps} accentColor={C.green} />
      </div>

      {/* Divider */}
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"8px 0 20px",opacity:0.35}}>
        <div style={{flex:1,height:1,background:C.border}}/>
        <span style={{fontSize:10,letterSpacing:2,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,textTransform:"uppercase",flexShrink:0}}>Losers Bracket</span>
        <div style={{flex:1,height:1,background:C.border}}/>
      </div>

      {/* Losers on bottom */}
      <div>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:3,color:C.orangeText,textTransform:"uppercase",fontFamily:"'Barlow Condensed', sans-serif",marginBottom:10,paddingLeft:2}}>
          ▼ Losers Bracket
        </div>
        <BracketSection rounds={losersRounds} {...sharedProps} accentColor={C.orange} />
      </div>
    </div>
  );
}

// ─── Bracket Editor ───────────────────────────────────────────────────────────
function BracketEditor({bracket,onSave,onCancel,saving}){
  const[rounds,setRounds]=useState(JSON.parse(JSON.stringify(bracket.rounds)));
  const updateGame=(ri,gi,field,value)=>setRounds(prev=>prev.map((r,i)=>i===ri?{...r,games:r.games.map((g,j)=>j===gi?{...g,[field]:value}:g)}:r));
  const addGame=ri=>setRounds(prev=>prev.map((r,i)=>i===ri?{...r,games:[...r.games,{team1:"",team2:""}]}:r));
  const removeGame=(ri,gi)=>setRounds(prev=>prev.map((r,i)=>i===ri?{...r,games:r.games.filter((_,j)=>j!==gi)}:r));
  const updateRoundName=(ri,name)=>setRounds(prev=>prev.map((r,i)=>i===ri?{...r,name}:r));
  const addRound=()=>setRounds(prev=>[...prev,{name:`Round ${prev.length+1}`,games:[{team1:"",team2:""}]}]);
  const removeRound=ri=>setRounds(prev=>prev.filter((_,i)=>i!==ri));
  return(
    <FormCard title={`Edit Bracket: ${bracket.title}`}>
      {rounds.map((round,ri)=>(
        <div key={ri} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,borderRadius:8,padding:16,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <input type="text" value={round.name} onChange={e=>updateRoundName(ri,e.target.value)} style={{...inputStyle,flex:1,padding:"7px 10px",fontSize:23,fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}/>
            <button onClick={()=>removeRound(ri)} style={{...deleteBtn,padding:"6px 12px",fontSize:12}}>Remove</button>
          </div>
          {round.games.map((game,gi)=>(
            <div key={gi} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,background:"rgba(0,0,0,0.2)",padding:"10px 12px",borderRadius:6,border:`1px solid ${C.border}`}}>
              <span style={{fontSize:23,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,width:20,flexShrink:0}}>G{gi+1}</span>
              <div style={{flex:1}}><input type="text" placeholder="Team 1" value={game.team1} onChange={e=>updateGame(ri,gi,"team1",e.target.value)} style={{...inputStyle,padding:"7px 10px",fontSize:13}}/></div>
              <span style={{color:C.textMuted,fontSize:21,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,flexShrink:0}}>vs</span>
              <div style={{flex:1}}><input type="text" placeholder='Team 2 or "BYE"' value={game.team2} onChange={e=>updateGame(ri,gi,"team2",e.target.value)} style={{...inputStyle,padding:"7px 10px",fontSize:13}}/></div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                <input type="date" value={game.date||""} onChange={e=>updateGame(ri,gi,"date",e.target.value)} style={{...inputStyle,width:120,padding:"7px 8px",fontSize:11}}/>
                <input type="time" value={game.time||""} onChange={e=>updateGame(ri,gi,"time",e.target.value)} style={{...inputStyle,width:80,padding:"7px 8px",fontSize:11}}/>
              </div>
              <div style={{flex:1.2}}><input type="text" placeholder="Location" value={game.location||""} onChange={e=>updateGame(ri,gi,"location",e.target.value)} style={{...inputStyle,padding:"7px 10px",fontSize:11}}/></div>
              {game.score1!==undefined&&<span style={{fontSize:21,color:C.greenText,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,flexShrink:0,minWidth:40,textAlign:"center"}}>{game.score1}–{game.score2}</span>}
              <button onClick={()=>removeGame(ri,gi)} style={{...deleteBtn,padding:"4px 8px",flexShrink:0}}>✕</button>
            </div>
          ))}
          <button onClick={()=>addGame(ri)} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.textMuted,width:"100%",padding:"8px",borderRadius:6,cursor:"pointer",fontSize:21,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>+ Add Game</button>
        </div>
      ))}
      <button onClick={addRound} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.textMuted,width:"100%",padding:"10px",borderRadius:6,cursor:"pointer",fontSize:21,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>+ Add Round</button>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>onSave(rounds)} style={{...primaryBtn,flex:1}}>{saving?"Saving…":"Save Changes"}</button>
        <button onClick={onCancel} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.textMuted,padding:"13px 20px",borderRadius:6,cursor:"pointer",fontFamily:"'Barlow Condensed', sans-serif",fontSize:23,letterSpacing:1}}>Cancel</button>
      </div>
    </FormCard>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const[view,setView]=useState("baseball");
  const[expandedTeam,setExpanded]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[adminTab,setAdminTab]=useState("result");
  const[activeBracket,setActiveBracket]=useState(0);
  const[editingBracket,setEditingBracket]=useState(null);

  const[records,setRecords]=useState(defaultRecords());
  const[games,setGames]=useState([]);
  const[schedule,setSchedule]=useState({});
  const[brackets,setBrackets]=useState([]);
  const[eliminated,setEliminated]=useState({});
  const[seeded,setSeeded]=useState(false);

  const[loaded,setLoaded]=useState(false);
  const[saving,setSaving]=useState(false);
  const[saveMsg,setSaveMsg]=useState("");
  const[dbError,setDbError]=useState("");
  const[password,setPassword]=useState("");

  const[authError,setAuthError]=useState(false);

  const[resultForm,setResultForm]=useState({teamId:ALL_TEAMS[0].id,opponent:"",teamScore:"",oppScore:"",date:new Date().toISOString().slice(0,10),result:"W",round:""});
  const[schedForm,setSchedForm]=useState({teamId:ALL_TEAMS[0].id,opponent:"",date:new Date().toISOString().slice(0,10),time:"",location:""});

  useEffect(()=>{loadAll();},[]);

  async function loadAll(){
    try{
      const[g,r,s,b,e]=await Promise.all([
        sbGet("games","order=date.desc"),
        sbGet("records"),
        sbGet("schedule","order=date.asc"),
        sbGet("brackets"),
        sbGet("eliminated").catch(()=>[]),
      ]);
      const recMap=defaultRecords();r.forEach(row=>{recMap[row.team_id]={w:row.w,l:row.l};});setRecords(recMap);
      setGames(g.map(row=>({id:row.id,teamId:row.team_id,opponent:row.opponent,teamScore:row.team_score,oppScore:row.opp_score,result:row.result,date:row.date,round:row.round||""})));
      const sm={};s.forEach(row=>{if(!sm[row.team_id])sm[row.team_id]=[];sm[row.team_id].push({id:row.id,teamId:row.team_id,opponent:row.opponent,date:row.date,time:row.time||"",location:row.location||""});});

      // Merge seed schedules with DB schedules
      const merged={...sm};
      Object.entries(SEED_SCHEDULES).forEach(([teamId,seedGames])=>{
        const existing=merged[teamId]||[];
        const existingIds=new Set(existing.map(g=>g.id));
        const toAdd=seedGames.filter(g=>!existingIds.has(g.id));
        if(toAdd.length>0) merged[teamId]=[...existing,...toAdd].sort((a,b)=>a.date.localeCompare(b.date));
      });
      setSchedule(merged);

      // Use DB brackets if available, otherwise fall back to seed data (read-only on load)
      if(b.length>0){
        // Check if any DB brackets still have placeholder team names - merge seed data if so
        const merged=SEED_BRACKETS.map(seed=>{
          const db=b.find(row=>row.id===seed.id);
          if(!db) return seed;
          const hasPlaceholders=JSON.stringify(db.rounds||"").includes('"Team ');
          return hasPlaceholders
            ?{id:seed.id,title:seed.title,type:seed.type,teamNames:seed.teamNames,rounds:seed.rounds}
            :{id:db.id,title:db.title,type:db.type,teamNames:db.team_names||[],rounds:db.rounds||[]};
        });
        // Include any DB brackets not in seed data
        const seedIds=new Set(SEED_BRACKETS.map(s=>s.id));
        b.filter(row=>!seedIds.has(row.id)).forEach(row=>{
          merged.push({id:row.id,title:row.title,type:row.type,teamNames:row.team_names||[],rounds:row.rounds||[]});
        });
        setBrackets(merged);
      } else {
        setBrackets(SEED_BRACKETS);
      }
      setSeeded(true);
      const em={};e.forEach(row=>{em[row.team_id]=true;});setEliminated(em);
    } catch(err){setDbError("Could not connect to database. Check your connection.");}
    setLoaded(true);
  }

  function flash(msg){setSaveMsg(msg);setTimeout(()=>setSaveMsg(""),2500);}

  function handleLogin(){
    if(password===ADMIN_PASSWORD){setIsAdmin(true);setView("admin");setAuthError(false);setPassword("");}
    else setAuthError(true);
  }

  function handleLogout(){
    setIsAdmin(false);
    setView("baseball");
  }

  async function toggleEliminated(teamId){
    const isElim=!!eliminated[teamId];
    try{
      if(isElim){await sbDelete("eliminated",{team_id:teamId});setEliminated(prev=>{const n={...prev};delete n[teamId];return n;});}
      else{await sbUpsert("eliminated",[{team_id:teamId}]);setEliminated(prev=>({...prev,[teamId]:true}));}
    }catch(e){flash("Error updating");}
  }

  async function handleAddResult(){
    const{teamId,opponent,teamScore,oppScore,date,result,round}=resultForm;
    if(!opponent||teamScore===""||oppScore==="")return;
    setSaving(true);
    try{
      const id=Date.now();
      await sbUpsert("games",[{id,team_id:teamId,opponent,team_score:parseInt(teamScore),opp_score:parseInt(oppScore),date,result,round:round||null}]);
      const nr={...records[teamId]};if(result==="W")nr.w+=1;else nr.l+=1;
      await sbUpsert("records",[{team_id:teamId,w:nr.w,l:nr.l}]);
      setRecords(prev=>({...prev,[teamId]:nr}));
      setGames(prev=>[{id,teamId,opponent,teamScore:parseInt(teamScore),oppScore:parseInt(oppScore),date,result,round},...prev]);
      setResultForm(f=>({...f,opponent:"",teamScore:"",oppScore:"",round:""}));
      flash("✓ Saved");
    }catch(e){flash("Error saving");}
    setSaving(false);
  }

  async function handleDeleteResult(game){
    try{
      await sbDelete("games",{id:game.id});
      const rec={...records[game.teamId]};if(game.result==="W")rec.w=Math.max(0,rec.w-1);else rec.l=Math.max(0,rec.l-1);
      await sbUpsert("records",[{team_id:game.teamId,w:rec.w,l:rec.l}]);
      setRecords(prev=>({...prev,[game.teamId]:rec}));setGames(prev=>prev.filter(g=>g.id!==game.id));
    }catch(e){flash("Error deleting");}
  }

  async function handleAddSchedule(){
    const{teamId,opponent,date,time,location}=schedForm;
    if(!opponent||!date)return;
    setSaving(true);
    try{
      const id=Date.now();
      await sbUpsert("schedule",[{id,team_id:teamId,opponent,date,time:time||null,location:location||null}]);
      const entry={id,teamId,opponent,date,time,location};
      setSchedule(prev=>({...prev,[teamId]:[...(prev[teamId]||[]),entry].sort((a,b)=>a.date.localeCompare(b.date))}));
      setSchedForm(f=>({...f,opponent:"",time:"",location:""}));
      flash("✓ Saved");
    }catch(e){flash("Error saving");}
    setSaving(false);
  }

  async function handleDeleteScheduled(teamId,gameId){
    try{await sbDelete("schedule",{id:gameId});setSchedule(prev=>({...prev,[teamId]:(prev[teamId]||[]).filter(g=>g.id!==gameId)}));}
    catch(e){flash("Error");}
  }

  async function handleSaveEditedBracket(bracketId,newRounds){
    const bracket=brackets.find(b=>b.id===bracketId);if(!bracket)return;
    setSaving(true);
    try{
      await sbUpsert("brackets",[{id:bracketId,title:bracket.title,type:bracket.type,team_names:bracket.teamNames||[],rounds:newRounds}]);
      setBrackets(prev=>prev.map(b=>b.id===bracketId?{...b,rounds:newRounds}:b));
      setEditingBracket(null);flash("✓ Bracket saved");
    }catch(e){flash("Error saving bracket");}
    setSaving(false);
  }

  async function handleUpdateBracketGame(bracketId,ri,gi,s1,s2){
    const bracket=brackets.find(b=>b.id===bracketId);if(!bracket)return;
    const rounds=bracket.rounds.map((r,rIdx)=>rIdx!==ri?r:{...r,games:r.games.map((g,gIdx)=>gIdx!==gi?g:{...g,score1:s1,score2:s2,winner:s1>s2?g.team1:g.team2})});
    try{await sbUpsert("brackets",[{id:bracketId,title:bracket.title,type:bracket.type,team_names:bracket.teamNames||[],rounds}]);setBrackets(prev=>prev.map(b=>b.id===bracketId?{...b,rounds}:b));}
    catch(e){flash("Error saving result");}
  }

  async function handleDeleteBracket(id){
    try{await sbDelete("brackets",{id});setBrackets(prev=>prev.filter(b=>b.id!==id));setActiveBracket(0);setEditingBracket(null);}
    catch(e){flash("Error deleting");}
  }

  const teamName=id=>ALL_TEAMS.find(t=>t.id===id)?.name||id;
  const teamDiv=id=>TEAMS.baseball.find(t=>t.id===id)?"Baseball":"Softball";

  if(!loaded)return(<div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><style>{FONT_IMPORT}</style><div style={{width:36,height:36,border:"3px solid rgba(255,255,255,0.1)",borderTop:`3px solid ${C.orange}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><div style={{color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontSize:23,letterSpacing:3}}>LOADING…</div></div>);
  if(dbError)return(<div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><style>{FONT_IMPORT}</style><div style={{background:"rgba(20,20,20,0.98)",border:`1px solid ${C.border}`,borderRadius:8,padding:32,textAlign:"center",maxWidth:400}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><div style={{color:C.textSecondary,fontFamily:"'Barlow', sans-serif",marginBottom:20}}>{dbError}</div><button onClick={loadAll} style={{...primaryBtn,width:"auto",padding:"10px 28px"}}>Retry</button></div></div>);

  return(
    <>
      <style>{FONT_IMPORT}</style>
      <div style={{minHeight:"100vh",background:C.dark,fontFamily:"'Barlow', sans-serif",color:C.textPrimary}}>

        {/* HEADER */}
        <div style={{position:"relative",overflow:"hidden",background:"#0d1a0d"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(-55deg,transparent,transparent 3px,rgba(255,255,255,0.015) 3px,rgba(255,255,255,0.015) 4px)"}}/>
          <div style={{position:"absolute",top:-40,right:-60,width:320,height:200,background:"linear-gradient(135deg,#E85D04 0%,#ff7c2a 50%,transparent 75%)",transform:"skewX(-15deg)",opacity:0.18}}/>
          <div style={{position:"absolute",top:-20,right:80,width:180,height:160,background:"linear-gradient(135deg,#2D6A2D 0%,#4a9e4a 60%,transparent 85%)",transform:"skewX(-15deg)",opacity:0.25}}/>
          <div style={{position:"absolute",bottom:0,left:-20,width:200,height:80,background:"linear-gradient(45deg,#E85D04,transparent)",opacity:0.1,transform:"skewX(10deg)"}}/>
          <div style={{maxWidth:900,margin:"0 auto",padding:"28px 20px 0",position:"relative"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:4,height:16,background:C.orange,borderRadius:2}}/>
                <span style={{fontSize:23,letterSpacing:3,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:600,textTransform:"uppercase"}}>NC District 6</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                {isAdmin
                  ?<>{view==="admin"
                    ?<><button onClick={()=>setView("baseball")} style={headerBtn}>← SCOREBOARD</button><button onClick={handleLogout} style={{...headerBtn,marginLeft:4,color:C.orangeText,borderColor:"rgba(232,93,4,0.4)"}}>LOGOUT</button></>
                    :<button onClick={()=>setView("admin")} style={headerBtn}>ADMIN</button>
                  }</>
                  :<button onClick={()=>setView("login")} style={headerBtn}>BOARD LOGIN</button>
                }
              </div>
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:20,marginBottom:24}}>
              <div style={{width:84,height:84,borderRadius:"50%",background:"linear-gradient(145deg,#2D6A2D,#1a3d1a)",border:`3px solid ${C.orange}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 20px rgba(232,93,4,0.35),inset 0 1px 0 rgba(255,255,255,0.1)",lineHeight:1}}>
                <span style={{fontSize:23,fontWeight:700,color:C.orange,letterSpacing:1,fontFamily:"'Barlow Condensed', sans-serif"}}>SDLL</span>
                <span style={{fontSize:25,marginTop:1}}>⚾</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:"clamp(16px,3vw,20px)",letterSpacing:5,color:C.orange,marginBottom:2}}>South Durham Little League</div>
                <div style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:"clamp(42px,8vw,70px)",letterSpacing:3,lineHeight:0.9,color:C.textPrimary,textShadow:"0 2px 20px rgba(0,0,0,0.5)"}}>2026 ALL STAR</div>
                <div style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:"clamp(26px,5vw,42px)",letterSpacing:6,color:C.green,WebkitTextStroke:"1px #4a9e4a",textShadow:"0 0 30px rgba(45,106,45,0.4)"}}>SCOREBOARD</div>
              </div>
            </div>
            <div style={{height:3,background:"linear-gradient(90deg,#E85D04,#ff9a4a,#E85D04)",backgroundSize:"200% 100%",animation:"shimmer 3s linear infinite",margin:"0 -20px"}}/>
            {view!=="admin"&&view!=="login"&&(
              <div style={{display:"flex",gap:2}}>
                {[{key:"baseball",label:"⚾  Baseball",count:TEAMS.baseball.length},{key:"softball",label:"🥎  Softball",count:TEAMS.softball.length},{key:"brackets",label:"🏆  Brackets",count:brackets.length}].map(tab=>(
                  <button key={tab.key} className="tab-btn" onClick={()=>{setView(tab.key);setExpanded(null);}} style={{background:view===tab.key?"rgba(255,255,255,0.07)":"transparent",border:"none",borderBottom:view===tab.key?`3px solid ${C.orange}`:"3px solid transparent",color:view===tab.key?C.textPrimary:C.textMuted,padding:"14px 20px 12px",cursor:"pointer",fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,fontSize:23,letterSpacing:2,textTransform:"uppercase",borderRadius:"4px 4px 0 0",marginTop:6}}>
                    {tab.label}{tab.count>0&&<span style={{marginLeft:7,background:view===tab.key?C.orange:"rgba(255,255,255,0.08)",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:19,fontWeight:700}}>{tab.count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px 48px"}}>

          {/* LOGIN */}
          {view==="login"&&(
            <div style={{maxWidth:380,margin:"40px auto"}}>
              <div style={{background:"rgba(15,15,15,0.98)",borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                <div style={{background:`linear-gradient(135deg,${C.green},#1a3d1a)`,padding:"22px 24px 18px",textAlign:"center",borderBottom:`4px solid ${C.orange}`}}>
                  <div style={{fontSize:32,marginBottom:6}}>🔒</div>
                  <div style={{color:C.textPrimary,fontWeight:700,fontSize:19,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>BOARD MEMBER ACCESS</div>
                  <div style={{color:C.textMuted,fontSize:21,marginTop:3}}>Manage results, schedules & brackets</div>
                </div>
                <div style={{padding:24}}>
                  <Label>Password</Label>
                  <input type="password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{...inputStyle,borderColor:authError?C.orange:"rgba(255,255,255,0.1)",marginBottom:authError?6:16}}/>
                  {authError&&<div style={{color:C.orange,fontSize:21,marginBottom:14,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>Incorrect password.</div>}
                  <button onClick={handleLogin} style={primaryBtn}>Sign In</button>
                </div>
              </div>
            </div>
          )}

          {/* SCOREBOARD */}
          {(view==="baseball"||view==="softball")&&(()=>{
            const teams=view==="baseball"?TEAMS.baseball:TEAMS.softball;
            const active=teams.filter(t=>!eliminated[t.id]);
            const elim=teams.filter(t=>!!eliminated[t.id]);
            const ordered=[...active,...elim];
            return(
              <div>
                <div style={{display:"flex",alignItems:"center",padding:"0 16px 10px",borderBottom:`1px solid ${C.border}`,marginBottom:6}}>
                  <ColHead style={{width:24,marginRight:8}}>#</ColHead>
                  <ColHead style={{flex:1}}>Team</ColHead>
                  <ColHead style={{width:52,textAlign:"center"}}>W</ColHead>
                  <ColHead style={{width:52,textAlign:"center"}}>L</ColHead>
                  <ColHead style={{width:68,textAlign:"center"}}>PCT</ColHead>
                  <span style={{width:32}}/>
                </div>
                {elim.length>0&&active.length>0&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0 6px",opacity:0.5}}>
                    <div style={{flex:1,height:1,background:C.border}}/>
                    <span style={{fontSize:9,letterSpacing:2,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,textTransform:"uppercase",flexShrink:0}}>Still Active Above · Eliminated Below</span>
                    <div style={{flex:1,height:1,background:C.border}}/>
                  </div>
                )}
                {ordered.map((team,i)=>{
                  const rec=records[team.id]||{w:0,l:0};
                  const teamGames=games.filter(g=>g.teamId===team.id);
                  const today=new Date().toISOString().slice(0,10);
                  const upcoming=(schedule[team.id]||[]).filter(s=>s.date>=today);
                  const isExpanded=expandedTeam===team.id;
                  const isElim=!!eliminated[team.id];
                  const activeIdx=active.findIndex(t=>t.id===team.id);
                  const displayNum=isElim?"—":String(activeIdx+1).padStart(2,"0");
                  return(
                    <div key={team.id} className="team-row" style={{marginBottom:4,borderRadius:6,overflow:"hidden",border:`1px solid ${isExpanded?C.borderActive:C.border}`,boxShadow:isExpanded?`0 4px 24px ${C.orangeGlow}`:"none",animation:`fadeSlideIn 0.3s ease ${i*0.03}s both`,opacity:isElim?0.6:1}}>
                      <div onClick={()=>setExpanded(p=>p===team.id?null:team.id)} style={{display:"flex",alignItems:"center",padding:"16px 18px",cursor:"pointer",background:isExpanded?`linear-gradient(90deg,rgba(232,93,4,0.1) 0%,${C.cardHover} 100%)`:C.card,borderLeft:`3px solid ${isExpanded?C.orange:isElim?"rgba(255,255,255,0.1)":"transparent"}`}}>
                        <span style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:19,color:isElim?C.textMuted:"rgba(255,255,255,0.2)",width:24,flexShrink:0}}>{displayNum}</span>
                        <div style={{flex:1,marginLeft:8}}>
                          <div style={{fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,fontSize:23,letterSpacing:1,color:C.textPrimary,textDecoration:isElim?"line-through":"none",textDecorationColor:"rgba(255,255,255,0.3)"}}>
                            {team.name}{isElim&&<span style={{marginLeft:8,fontSize:19,letterSpacing:2,color:C.textMuted,fontWeight:600,textDecoration:"none",verticalAlign:"middle"}}>ELIMINATED</span>}
                          </div>
                          {(teamGames.length>0||upcoming.length>0)&&<div style={{fontSize:23,color:"rgba(255,255,255,0.55)",marginTop:1}}>{[teamGames.length>0?`${teamGames.length} result${teamGames.length!==1?"s":""}`:null, upcoming.length>0?`${upcoming.length} upcoming`:null].filter(Boolean).join(" · ")}</div>}
                        </div>
                        <div style={{width:52,textAlign:"center"}}><StatBadge value={rec.w} type="w"/></div>
                        <div style={{width:52,textAlign:"center"}}><StatBadge value={rec.l} type="l"/></div>
                        <div style={{width:68,textAlign:"center",fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,fontSize:19,color:rec.w+rec.l>0?C.textPrimary:C.textMuted}}>{pct(rec.w,rec.l)}</div>
                        <div style={{width:32,textAlign:"center",color:isExpanded?C.orange:C.textMuted,fontSize:23,transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s,color 0.2s"}}>▼</div>
                      </div>
                      {isExpanded&&(
                        <div style={{background:"rgba(10,10,10,0.98)",borderTop:`1px solid ${C.border}`}}>
                          {upcoming.length>0&&(
                            <div>
                              <div style={{padding:"8px 16px 6px 48px",background:"rgba(255,180,0,0.05)",borderBottom:"1px solid rgba(255,180,0,0.1)"}}><span style={{fontSize:19,fontWeight:700,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",fontFamily:"'Barlow Condensed', sans-serif"}}>📅 Upcoming</span></div>
                              {upcoming.map(g=>(
                                <div key={g.id} style={{display:"flex",alignItems:"center",padding:"11px 16px 11px 48px",borderBottom:`1px solid ${C.border}`,background:"rgba(255,180,0,0.02)",fontSize:15}}>
                                  <span style={{width:150,color:"#f59e0b",fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:0.5,flexShrink:0}}>{formatDateTime(g.date,g.time)}</span>
                                  <span style={{flex:1,color:C.textPrimary,fontSize:15}}>vs. {g.opponent}</span>
                                  {g.location&&<span style={{color:C.textMuted,fontSize:13}}>📍 {g.location}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {teamGames.length>0?(
                            <div>
                              <div style={{display:"flex",padding:"8px 16px 6px 48px",background:"rgba(255,255,255,0.02)",borderBottom:`1px solid ${C.border}`}}>
                                <ColHead style={{width:72}}>Date</ColHead><ColHead style={{flex:1}}>Opponent</ColHead><ColHead style={{width:64,textAlign:"center"}}>Score</ColHead><ColHead style={{width:50,textAlign:"center"}}>W/L</ColHead><ColHead style={{flex:0.8,textAlign:"right"}}>Round</ColHead>
                              </div>
                              {teamGames.map((g,gi)=>(
                                <div key={g.id} style={{display:"flex",alignItems:"center",padding:"10px 16px 10px 48px",borderBottom:gi<teamGames.length-1?`1px solid ${C.border}`:"none",background:gi%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
                                  <span style={{width:72,fontSize:21,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:600,letterSpacing:0.5}}>{formatDate(g.date)}</span>
                                  <span style={{flex:1,fontSize:19,color:C.textSecondary}}>vs. {g.opponent}</span>
                                  <span style={{width:64,textAlign:"center",fontSize:23,fontWeight:700,color:C.textPrimary,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>{g.teamScore}–{g.oppScore}</span>
                                  <div style={{width:50,textAlign:"center"}}><WLBadge result={g.result}/></div>
                                  <span style={{flex:0.8,textAlign:"right",fontSize:19,color:g.round?C.orange:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>{g.round||"—"}</span>
                                </div>
                              ))}
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px 10px 48px",background:`linear-gradient(90deg,rgba(232,93,4,0.06),transparent)`,borderTop:`1px solid rgba(232,93,4,0.15)`}}>
                                <span style={{fontSize:19,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>Season Record</span>
                                <span style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:23,letterSpacing:2,color:C.textPrimary}}>{rec.w}–{rec.l}<span style={{fontSize:19,color:C.textMuted,marginLeft:12,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:600}}>{pct(rec.w,rec.l)} PCT</span></span>
                              </div>
                            </div>
                          ):(
                            <div style={{padding:"24px 20px",textAlign:"center",color:C.textMuted,fontSize:19,fontStyle:"italic"}}>No games recorded yet. Check back after their first game!</div>
                          )}
                          {isAdmin&&(
                            <div style={{padding:"12px 20px 12px 48px",borderTop:`1px solid ${C.border}`,background:"rgba(255,255,255,0.02)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <span style={{fontSize:23,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1,textTransform:"uppercase"}}>Tournament Status</span>
                              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                                <div onClick={()=>toggleEliminated(team.id)} style={{width:40,height:22,borderRadius:11,background:isElim?"rgba(232,93,4,0.4)":"rgba(255,255,255,0.1)",border:`1px solid ${isElim?C.orange:C.border}`,position:"relative",transition:"all 0.2s",cursor:"pointer"}}>
                                  <div style={{position:"absolute",top:2,left:isElim?20:2,width:16,height:16,borderRadius:"50%",background:isElim?C.orange:"rgba(255,255,255,0.3)",transition:"left 0.2s,background 0.2s"}}/>
                                </div>
                                <span style={{fontSize:23,color:isElim?C.orange:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{isElim?"Eliminated":"Still Competing"}</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{marginTop:16,textAlign:"center",fontSize:19,color:C.textMuted,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:2,textTransform:"uppercase"}}>Tap any team to see their schedule & results</div>
              </div>
            );
          })()}

          {/* BRACKETS */}
          {view==="brackets"&&(
            <div>
              {brackets.length>1&&(
                <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                  {brackets.map((b,i)=>(
                    <button key={b.id||i} onClick={()=>setActiveBracket(i)} style={{background:activeBracket===i?C.green:"rgba(20,20,20,0.97)",border:`1px solid ${activeBracket===i?C.green:C.border}`,color:activeBracket===i?C.textPrimary:C.textSecondary,padding:"7px 14px",borderRadius:6,cursor:"pointer",fontSize:21,fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:0.5}}>{b.title}</button>
                  ))}
                </div>
              )}
              {brackets[activeBracket]&&(
                <div style={{background:"rgba(15,15,15,0.98)",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
                  <div style={{background:`linear-gradient(90deg,${C.green},#1a3d1a)`,borderBottom:`4px solid ${C.orange}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{color:C.textPrimary,fontWeight:700,fontSize:21,fontFamily:"'Bebas Neue', sans-serif",letterSpacing:2}}>🏆 {brackets[activeBracket].title}</div>
                      <div style={{color:C.textMuted,fontSize:23,marginTop:2,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>
                        {brackets[activeBracket].type==="double-elim"?"Double Elimination":brackets[activeBracket].type==="single-elim"?"Single Elimination":brackets[activeBracket].type==="pool-play"?"Pool Play":"Custom Format"}
                      </div>
                    </div>
                    {isAdmin&&<button onClick={()=>setEditingBracket(brackets[activeBracket].id||activeBracket)} style={{background:"transparent",border:`1px solid ${C.orange}`,color:C.orange,padding:"6px 14px",borderRadius:4,cursor:"pointer",fontSize:23,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1}}>✏️ EDIT</button>}
                  </div>
                  <div style={{padding:16}}>
                    <BracketView bracket={brackets[activeBracket]} isAdmin={isAdmin} onUpdateGame={isAdmin?(ri,gi,s1,s2)=>handleUpdateBracketGame(brackets[activeBracket].id||activeBracket,ri,gi,s1,s2):null}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADMIN */}
          {view==="admin"&&isAdmin&&(
            <div>
              {editingBracket!==null&&(()=>{
                const bracket=brackets.find(b=>(b.id||brackets.indexOf(b))===editingBracket)||brackets[editingBracket];
                return bracket?<BracketEditor bracket={bracket} saving={saving} onSave={(rounds)=>handleSaveEditedBracket(bracket.id||editingBracket,rounds)} onCancel={()=>setEditingBracket(null)}/>:null;
              })()}
              {editingBracket===null&&(
                <>
                  <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:`1px solid ${C.border}`}}>
                    {[{key:"result",label:"📋 Enter Result"},{key:"schedule",label:"📅 Add Game"},{key:"bracket",label:"🏆 Brackets"}].map(t=>(
                      <button key={t.key} onClick={()=>setAdminTab(t.key)} style={{background:adminTab===t.key?"rgba(255,255,255,0.06)":"transparent",border:"none",borderBottom:adminTab===t.key?`3px solid ${C.orange}`:"3px solid transparent",color:adminTab===t.key?C.textPrimary:C.textMuted,padding:"9px 16px",cursor:"pointer",fontSize:19,fontWeight:700,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1,textTransform:"uppercase",borderRadius:"4px 4px 0 0"}}>{t.label}</button>
                    ))}
                  </div>

                  {adminTab==="result"&&(
                    <div>
                      <FormCard title="Game Result">
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:4}}>
                          <div style={{gridColumn:"1 / -1"}}><Label>Team</Label><TeamSelect value={resultForm.teamId} onChange={v=>setResultForm(f=>({...f,teamId:v}))}/></div>
                          <div style={{gridColumn:"1 / -1"}}><Label>Opponent</Label><input type="text" placeholder="e.g. Bull City Little League" value={resultForm.opponent} onChange={e=>setResultForm(f=>({...f,opponent:e.target.value}))} style={inputStyle}/></div>
                          <div><Label>SDLL Score</Label><input type="number" min="0" value={resultForm.teamScore} onChange={e=>{const ts=e.target.value;const result=ts!==""&&resultForm.oppScore!==""?(parseInt(ts)>=parseInt(resultForm.oppScore)?"W":"L"):resultForm.result;setResultForm(f=>({...f,teamScore:ts,result}));}} style={{...inputStyle,fontSize:27,fontWeight:700,textAlign:"center",color:C.greenText}}/></div>
                          <div><Label>Opponent Score</Label><input type="number" min="0" value={resultForm.oppScore} onChange={e=>{const os=e.target.value;const result=resultForm.teamScore!==""&&os!==""?(parseInt(resultForm.teamScore)>=parseInt(os)?"W":"L"):resultForm.result;setResultForm(f=>({...f,oppScore:os,result}));}} style={{...inputStyle,fontSize:27,fontWeight:700,textAlign:"center",color:C.orangeText}}/></div>
                          <div><Label>Date</Label><input type="date" value={resultForm.date} onChange={e=>setResultForm(f=>({...f,date:e.target.value}))} style={inputStyle}/></div>
                          <div><Label>Round (optional)</Label><input type="text" placeholder="e.g. District Semis" value={resultForm.round} onChange={e=>setResultForm(f=>({...f,round:e.target.value}))} style={inputStyle}/></div>
                        </div>
                        {resultForm.teamScore!==""&&resultForm.oppScore!==""&&(
                          <div style={{margin:"16px 0",padding:"10px 16px",background:resultForm.result==="W"?"rgba(45,106,45,0.15)":"rgba(232,93,4,0.12)",border:`1px solid ${resultForm.result==="W"?"rgba(45,106,45,0.3)":"rgba(232,93,4,0.3)"}`,borderRadius:6,fontSize:23,fontWeight:700,color:resultForm.result==="W"?C.greenText:C.orangeText,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>
                            {resultForm.result==="W"?"✓ WIN":"✗ LOSS"} — {teamName(resultForm.teamId)} {resultForm.teamScore}, {resultForm.opponent||"Opponent"} {resultForm.oppScore}
                          </div>
                        )}
                        <button onClick={handleAddResult} disabled={!resultForm.opponent||resultForm.teamScore===""||resultForm.oppScore===""} style={{...primaryBtn,opacity:(!resultForm.opponent||resultForm.teamScore===""||resultForm.oppScore==="")? 0.4:1}}>
                          {saving?"Saving…":`Save Result${saveMsg?"  "+saveMsg:""}`}
                        </button>
                      </FormCard>
                      {games.length>0&&(
                        <div>
                          <SectionLabel>Recent Entries</SectionLabel>
                          {games.slice(0,12).map(g=>(
                            <div key={g.id} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${g.result==="W"?C.green:C.orange}`,borderRadius:6,marginBottom:6,padding:"9px 14px",display:"flex",alignItems:"center",gap:10,fontSize:13}}>
                              <span style={{fontWeight:700,color:g.result==="W"?C.greenText:C.orangeText,width:14}}>{g.result}</span>
                              <span style={{color:C.greenText,fontWeight:700,minWidth:110,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:0.5}}>{teamDiv(g.teamId)} {teamName(g.teamId)}</span>
                              <span style={{flex:1,color:C.textPrimary}}>vs. {g.opponent}</span>
                              <span style={{fontWeight:700,color:C.textPrimary,fontFamily:"'Barlow Condensed', sans-serif"}}>{g.teamScore}–{g.oppScore}</span>
                              <span style={{color:C.textMuted,fontSize:11}}>{formatDate(g.date)}</span>
                              {g.round&&<span style={{background:C.green,color:"#fff",borderRadius:3,padding:"1px 7px",fontSize:19,fontWeight:700}}>{g.round}</span>}
                              <button onClick={()=>handleDeleteResult(g)} style={deleteBtn}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {adminTab==="schedule"&&(
                    <div>
                      <FormCard title="Add Upcoming Game">
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:4}}>
                          <div style={{gridColumn:"1 / -1"}}><Label>Team</Label><TeamSelect value={schedForm.teamId} onChange={v=>setSchedForm(f=>({...f,teamId:v}))}/></div>
                          <div style={{gridColumn:"1 / -1"}}><Label>Opponent</Label><input type="text" placeholder="e.g. East Chapel Hill LL" value={schedForm.opponent} onChange={e=>setSchedForm(f=>({...f,opponent:e.target.value}))} style={inputStyle}/></div>
                          <div><Label>Date</Label><input type="date" value={schedForm.date} onChange={e=>setSchedForm(f=>({...f,date:e.target.value}))} style={inputStyle}/></div>
                          <div><Label>Time (optional)</Label><input type="time" value={schedForm.time} onChange={e=>setSchedForm(f=>({...f,time:e.target.value}))} style={inputStyle}/></div>
                          <div style={{gridColumn:"1 / -1"}}><Label>Location (optional)</Label><input type="text" placeholder="e.g. Herndon Park Field 1" value={schedForm.location} onChange={e=>setSchedForm(f=>({...f,location:e.target.value}))} style={inputStyle}/></div>
                        </div>
                        <button onClick={handleAddSchedule} disabled={!schedForm.opponent||!schedForm.date} style={{...primaryBtn,opacity:(!schedForm.opponent||!schedForm.date)?0.4:1}}>
                          {saving?"Saving…":"Add to Schedule"}
                        </button>
                      </FormCard>
                      {Object.keys(schedule).length>0&&(
                        <div>
                          <SectionLabel>Scheduled Games</SectionLabel>
                          {ALL_TEAMS.filter(t=>schedule[t.id]?.length>0).map(team=>(
                            <div key={team.id} style={{marginBottom:16}}>
                              <div style={{fontWeight:700,color:C.greenText,fontSize:19,marginBottom:6,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>{teamDiv(team.id)} — {team.name}</div>
                              {(schedule[team.id]||[]).map(g=>(
                                <div key={g.id} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${C.orange}`,borderRadius:6,marginBottom:5,padding:"8px 14px",display:"flex",alignItems:"center",gap:10,fontSize:12}}>
                                  <span style={{color:"#f59e0b",fontWeight:700,minWidth:100,fontFamily:"'Barlow Condensed', sans-serif"}}>{formatDateTime(g.date,g.time)}</span>
                                  <span style={{flex:1,color:C.textPrimary}}>vs. {g.opponent}</span>
                                  {g.location&&<span style={{color:C.textMuted}}>📍 {g.location}</span>}
                                  <button onClick={()=>handleDeleteScheduled(team.id,g.id)} style={deleteBtn}>✕</button>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {adminTab==="bracket"&&(
                    <div>
                      <SectionLabel>Tournament Brackets ({brackets.length} loaded from PDFs)</SectionLabel>
                      {brackets.map((b,i)=>(
                        <div key={b.id||i} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${C.green}`,borderRadius:6,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div>
                            <div style={{fontWeight:700,color:C.greenText,fontSize:23,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>🏆 {b.title}</div>
                            <div style={{fontSize:23,color:C.textMuted,marginTop:2,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>{b.type==="double-elim"?"Double Elimination":b.type==="pool-play"?"Pool Play":"Single Elimination"} · {b.teamNames?.length||0} teams · {b.rounds?.reduce((a,r)=>a+r.games.length,0)||0} games</div>
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>setEditingBracket(b.id||i)} style={{background:"transparent",border:`1px solid ${C.orange}`,color:C.orange,borderRadius:4,padding:"4px 12px",cursor:"pointer",fontSize:23,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,letterSpacing:1}}>✏️ Edit</button>
                            <button onClick={()=>handleDeleteBracket(b.id||i)} style={{...deleteBtn,padding:"4px 10px",fontSize:12}}>Delete</button>
                          </div>
                        </div>
                      ))}
                      <div style={{marginTop:16,padding:"12px 16px",background:"rgba(45,106,45,0.08)",border:`1px solid rgba(45,106,45,0.2)`,borderRadius:6,fontSize:21,color:C.textSecondary,fontFamily:"'Barlow', sans-serif",lineHeight:1.6}}>
                        <strong style={{color:C.greenText,fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:1}}>ALL 8 BRACKETS PRE-LOADED</strong> from your district PDFs. Click ✏️ Edit on any bracket to assign actual team names to the seeded slots, adjust matchups, or enter scores as games are played.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{background:C.darker,borderTop:`3px solid ${C.orange}`,padding:"18px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(232,93,4,0.04),transparent)"}}/>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif",fontWeight:600,fontSize:23,letterSpacing:4,color:C.textMuted,textTransform:"uppercase",position:"relative"}}>
            South Durham Little League · NC District 6 · 2026 All Stars
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle={width:"100%",padding:"10px 12px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"#1a1a1a",color:"#fff",fontSize:23,boxSizing:"border-box",fontFamily:"'Barlow', sans-serif",outline:"none"};
const primaryBtn={width:"100%",background:`linear-gradient(135deg,#2D6A2D,#1e4d1e)`,border:`2px solid #E85D04`,color:"#fff",padding:"13px",borderRadius:6,fontSize:21,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed', sans-serif",letterSpacing:2,textTransform:"uppercase"};
const headerBtn={background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",padding:"6px 14px",borderRadius:4,cursor:"pointer",fontSize:19,letterSpacing:2,fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,textTransform:"uppercase"};
const deleteBtn={background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"#ff8c4a",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:23,fontFamily:"'Barlow', sans-serif"};
