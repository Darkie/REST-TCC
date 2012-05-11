% -----------------------------------------------------------------------------
% LaTeX class for the doctoral dissertation at the Faculty of
% Informatics of University of Lugano
% 
% Domenico Bianculli <domenico.bianculli@lu.unisi.ch>
% Jochen Wuttke <wuttkej@lu.unisi.ch>
%
% -----------------------------------------------------------------------------
%%
%% This file is 'USIINFthesis.cls'
%% 
%% It may be distributed and/or modified under the
%% conditions of the LaTeX Project Public License, either version 1.3c
%% of this license or (at your option) any later version.
%% The latest version of this license is in
%%    http://www.latex-project.org/lppl.txt
%% and version 1.3c or later is part of all distributions of LaTeX
%% version 2005/12/01 or later.

%%% identification
\NeedsTeXFormat{LaTeX2e}[1995/12/01]
\ProvidesClass{usiinfthesis}[2010/04/14 v. 1.1.2 %
 USI Informatics Doctoral Dissertation class]
%%% initial code
\RequirePackage{xifthen}
%%% true to produce a version suitable for printing
\newboolean{@printversion}
%%% true to enable automatic loading of hyperref package
\newboolean{@hypermode}
%%% true if a subtitle is provided
\newboolean{@subtitle}
%%% true if a coadvisor is provided
\newboolean{@coadvisor}
%%% true if a dedication is provided
\newboolean{@dedication}
%%% true if an epigraph is provided
\newboolean{@epigraph}
%%% true to insert a copyright notice
\newboolean{@crn}
%%% true if the document is a master thesis
\newboolean{@mscthesis}
% true if a master specialization is provided
\newboolean{@mscspec}
% true if the lulu options is provided
\newboolean{@lulu}
\DeclareOption{lulu}{%
\setboolean{@lulu}{true}
\setboolean{@crn}{true}
%\setboolean{@crn}{true}
}
%%% declaration of options
\DeclareOption{print}{\setboolean{@printversion}{true}}
  {%redefine margins to match oneside layout
  }
%%% enable/disable hyperref
\DeclareOption{hyper}{\setboolean{@hypermode}{true}}
\DeclareOption{nohyper}{\setboolean{@hypermode}{false}}
% Produces a copyright notice. Enable if PhD program director likes it.
\DeclareOption{crn}{\setboolean{@crn}{true}}
%%%
\DeclareOption{a5paper}{\OptionNotUsed}
\DeclareOption{letterpaper}{\OptionNotUsed}
\DeclareOption{b5paper}{\OptionNotUsed}
\DeclareOption{legalpaper}{\OptionNotUsed}
\DeclareOption{executivepaper}{\OptionNotUsed}
\DeclareOption{landscape}{\OptionNotUsed}
\DeclareOption{openany}{\OptionNotUsed}
\DeclareOption{twocolumn}{\OptionNotUsed}
\DeclareOption{oneside}{\OptionNotUsed}
\DeclareOption{twoside}{\OptionNotUsed}
%%% enable settings for a master thesis
\DeclareOption{mscthesis}{\setboolean{@mscthesis}{true}}

%%%
\DeclareOption*{% 
\PassOptionsToClass{\CurrentOption}{book}% 
} 
%%% execution of options
\ExecuteOptions{hyper}
\ProcessOptions \relax
\typeout{*** Please report bugs, comments, suggestions, and improvements
  to: }
\typeout{*** Domenico Bianculli <domenico.bianculli@usi.ch>}
\typeout{*** Jochen Wuttke <wuttkej@usi.ch>}
%%% package loading
\ifthenelse{\boolean{@lulu}}
{\LoadClass[a4paper,10pt,twoside,onecolumn,openright,titlepage]{book}}
{\LoadClass[a4paper,twoside,onecolumn,openright,titlepage]{book}}
%%% main code


%font settings
\RequirePackage[T1]{fontenc}
%\RequirePackage[charter]{mathdesign}
\RequirePackage[scaled]{beramono}
\renewcommand{\sfdefault}{uop}
%\renewcommand{\scshape}{%
%\not@math@alphabet\scshape\relax
%\ifthenelse{\equal{\f@family}{uop}}
%{\fontshape{sc}\selectfont}%
%{\fontshape{fsc}\selectfont}%
%}


%sans-serif titles
\RequirePackage{sectsty}
\allsectionsfont{\sffamily}

%geometry
\RequirePackage[a4paper]{geometry}
\geometry{hscale=0.66}
\ifthenelse{\boolean{@printversion}}{}%
{  \geometry{asymmetric}
  \geometry{bindingoffset=0pt,hmarginratio=1:1}
}
\ifthenelse{\boolean{@lulu}}%
{
  \renewcommand\@ptsize{0}%% set font size to 10pt
  \geometry{papersize={6in, 9in}}
  \geometry{inner=.625in, outer=.5in, top=.5in, bottom=0.75in,  
  includehead,includefoot,twoside}
}{}


%%% fancy headers
\RequirePackage{fancyhdr}
\setlength{\headheight}{15pt}
\fancypagestyle{cover}{%
  \fancyhf{}
  \fancyhead{\mbox{ }}
}
\fancypagestyle{hrulefpage}{%
  \fancyhf{}
   \fancyhead{\mbox{ }}
  \fancyfoot[C]{\sf \thepage}
}
%modifying captions
\RequirePackage[font=sf,labelsep=period]{caption}
%datatool
\RequirePackage{datatool}
\RequirePackage{calc}

%commands to print empty values in the database 
\newcommand{\print@blank}[1]{\ifthenelse{\equal{#1}{!blank!}}{}{#1\ }}
\newcommand{\print@empty}[1]{\ifthenelse{\equal{#1}{!blank!}}{}{#1}}
%%% populate the committee database
%%% format of the rows (name of the columns in brackets) :
%%% Title [title], First and Middle [first], Last [last], Affiliation
%%% [aff], Type ([a]dvisor, [c]oadvisor, [e]xternal, [i]nternal) [type]
\newenvironment{committee}{%
\DTLnewdb{committee}
}%
{%
\DTLsort{last}{committee}
}

\newcounter{advisors}
\newcommand{\advisor}[4][Universit\`a della Svizzera Italiana, Switzerland]{%
\DTLnewrow{committee}
\ifthenelse{\isempty{#2}}{\DTLnewdbentry{committee}{title}{!blank!}}{%
\DTLnewdbentry{committee}{title}{#2}}
\DTLnewdbentry{committee}{first}{#3}
\DTLnewdbentry{committee}{last}{#4}
\DTLnewdbentry{committee}{aff}{#1}
\DTLnewdbentry{committee}{type}{a}
\stepcounter{advisors}
}


\newcounter{coadvisors}
\newcommand{\coadvisor}[4]{%
\DTLnewrow{committee}
\ifthenelse{\isempty{#1}}{\DTLnewdbentry{committee}{title}{!blank!}}{%
\DTLnewdbentry{committee}{title}{#1}}
\DTLnewdbentry{committee}{first}{#2}
\DTLnewdbentry{committee}{last}{#3}
\DTLnewdbentry{committee}{aff}{#4}
\DTLnewdbentry{committee}{type}{c}
\stepcounter{coadvisors}
}

\newcounter{internalmembers}
\newcommand{\internalmember}[4][Universit\`a della Svizzera Italiana, Switzerland]{%
\DTLnewrow{committee}
\ifthenelse{\isempty{#2}}{\DTLnewdbentry{committee}{title}{!blank!}}{%
\DTLnewdbentry{committee}{title}{#2}}
\DTLnewdbentry{committee}{first}{#3}
\DTLnewdbentry{committee}{last}{#4}
\DTLnewdbentry{committee}{aff}{#1}
\DTLnewdbentry{committee}{type}{i}
\stepcounter{internalmembers}
}

\newcounter{externalmembers}
\newcommand{\externalmember}[4]{%
\DTLnewrow{committee}
\ifthenelse{\isempty{#1}}{\DTLnewdbentry{committee}{title}{!blank!}}{%
\DTLnewdbentry{committee}{title}{#1}}
\DTLnewdbentry{committee}{first}{#2}
\DTLnewdbentry{committee}{last}{#3}
\DTLnewdbentry{committee}{aff}{#4}
\DTLnewdbentry{committee}{type}{e}
\stepcounter{externalmembers}
}



%%% additional titlepage content commands
\newcommand{\programDirector}[1]{\gdef\@progdir{#1}}
\newcommand{\subtitle}[1]{\gdef\@subtitle{#1}\setboolean{@subtitle}{true}}
\newcommand{\Month}[1]{\gdef\@month{#1}}
\newcommand{\Year}[1]{\gdef\@year{#1}}
\newcommand{\specialization}[1]{\gdef\@specialization{#1}\setboolean{@mscspec}{true}}

%%% title page
\renewcommand{\maketitle}
{\pagenumbering{Alph}\begin{titlepage}%
  \pagestyle{cover}
  \begin{center}
    \null
    \vfill

    \noindent {\LARGE {\bf \sffamily\@title}}\\[6mm]
    \ifthenelse{\boolean{@subtitle}}{%
      \noindent{\large \bf \sffamily\@subtitle}\\
    }{}
    \vspace{10mm}
    \ifthenelse{\boolean{@mscthesis}}{Master's Thesis}{Doctoral
    Dissertation}
    {submitted to the}\\[2mm]
    {Faculty of Informatics of the \em{Universit\`a della Svizzera Italiana}}\\[2mm]
    {in partial fulfillment of the requirements for the degree of}\\[2mm]
     \ifthenelse{\boolean{@mscthesis}}{%
     Master of Science in Informatics%
     \ifthenelse{\boolean{@mscspec}}{\\[2mm] \@specialization\\[16mm]}{\\[32mm]}}
    {Doctor of Philosophy \\[32mm]}
    {presented by}\\[2mm]
    {\Large {\bf\sffamily \@author}}
    \vfill
    \vfill
    
    {under the supervision of}\\[2mm]
    \DTLforeach*[\DTLiseq{\type}{a}]{committee}%
    {\actitle=title,\first=first,\last=last,\type=type}{%
     {\large {\DTLiffirstrow{}{, }\print@blank{\actitle}\first \ \last}}%
    }
    \ifthenelse{\value{coadvisors} > 0}{%
    \\[2mm] co-supervised by\\[2mm]
    \DTLforeach*[\DTLiseq{\type}{c}]{committee}%
    {\actitle=title,\first=first,\last=last,\type=type}{%
     {\large {\DTLiffirstrow{}{, }\print@blank{\actitle}\first \ \last}}%
    }}{}
    \vfill
    {\@month\ \@year}\\
  \end{center}
  \end{titlepage}%
  \setcounter{footnote}{0}%
} %%% end titlepage

\renewenvironment{titlepage}
    {%
      \cleardoublepage
      \setcounter{page}\z@
    }%
    {\newpage }




%%% frontmatter may include an epigraph
\RequirePackage{epigraph}
\setlength{\epigraphrule}{0pt}

%% additional frontmatter content commands

\newcommand{\dedication}[1]{\gdef\@dedication{#1}\setboolean{@dedication}{true}}
\newcommand{\openepigraph}[2]{\gdef\@openepigraph{\epigraph{#1}{#2}}\setboolean{@epigraph}{true}}
\newcommand\Day[1]{\gdef\@dateaccepted{#1}}
\newcommand{\@dateaccepted}{\@latex@error{No \noexpand\day given}\@ehc}
\newcommand{\place}[1]{\gdef\@place{#1}}
\newcommand{\@place}{\@latex@error{No \noexpand\place given}\@ehc}
\newcommand{\@crnotice}{\vfill  \noindent Copyright \copyright\ \@year\ by \@author \\ All rights reserved. }
\newcommand{\@authdecl}{%
I certify that except where due acknowledgement has been given, the
work presented in this thesis is that of the author alone; the work
has not been submitted previously, in whole or in part, to qualify for
any other academic award; and the content of the thesis is the result
of work which has been carried out since the official commencement
date of the approved research program.\\[18mm]


  \hfill \begin{minipage}{6cm}
    
    \rule{6cm}{0.2mm}
    
    \@author

    \@place, \@dateaccepted\ \@month\ \@year

  \end{minipage}
  \clearpage
}


\renewcommand\frontmatter{%
  \@mainmatterfalse
  \pagenumbering{Roman}
    \clearpage
    
    \thispagestyle{empty}
    
    \mbox{ }

    \ifthenelse{\boolean{@crn}}{\@crnotice}{}
    \clearpage
    \pagestyle{empty}
    \pagenumbering{roman}
  \setcounter{page}{1}
    \pagestyle{hrulefpage}
    \ifthenelse{\boolean{@lulu}}{}{%No committee page in book
     \ifthenelse{\boolean{@mscthesis}}{}{%
     \begin{center}
    \vspace{1cm}
    \noindent {\large {\bf \sffamily Dissertation Committee}}\\[2mm]
    \vspace{12mm}
   \begin{tabular}{l@{}r@{\ }ll}
    %others
     \DTLforeach*[\DTLiseq{\type}{i}]{committee}%
     {\actitle=title,\first=first,\last=last,\type=type,\aff=aff}{%
     &%ack to remove spurious leading space in [i] rows
     \textbf{\print@empty{\actitle}} &
     \textbf{\first \ \last} & \aff\\ 
     }
     \\
     \DTLforeach*[\DTLiseq{\type}{e}]{committee}%
     {\actitle=title,\first=first,\last=last,\type=type,\aff=aff}{%
     &%ack to remove spurious leading space in [e] rows
     \textbf{\print@empty{\actitle}} &
     \textbf{\first \ \last} & \aff\\ 
     }
    \end{tabular}
    \vfill
    \noindent {Dissertation accepted on \@dateaccepted\ \@month\
    \@year}
    \vfill
    \vfill
    %advisor
    \DTLforeach*[\DTLiseq{\type}{a}]{committee}%
    {\actitle=title,\first=first,\last=last,\type=type,\aff=aff}{%
        \rule{.5\textwidth}{0.2mm} \\
        \textbf{\print@blank{\actitle}\first \ \last} \\
        Research Advisor \\ \aff
        \vfill
    }
    %coadvisor
    \DTLforeach*[\DTLiseq{\type}{c}]{committee}%
    {\actitle=title,\first=first,\last=last,\type=type,\aff=aff}{%
        \rule{.5\textwidth}{0.2mm} \\
        \textbf{\print@blank{\actitle}\first \ \last}\\ Research Co-Advisor \\ \aff
        \vfill
    }
    %director
    \rule{.5\textwidth}{0.2mm} \\ \textbf{\@progdir} \\ PhD
    Program Director  \vfill
    \end{center}
    \clearpage
    }
  \@authdecl
   \ifthenelse{\boolean{@mscthesis}}{\thispagestyle{empty}\cleardoublepage}{}
   }%end lulu exclude
  \pagestyle{plain}

  \ifthenelse{\boolean{@dedication}}{%
    \vspace*{5cm}
    \begin{flushright}
    {\Large \emph{\@dedication}}
    \end{flushright}
    \cleardoublepage
  }{}
  \ifthenelse{\boolean{@epigraph}}{%
    \vspace*{5cm}
    \@openepigraph
    \cleardoublepage
  }{}
     \fancypagestyle{plain}{%
    \fancyhf{}
    \fancyfoot[C]{\sf \thepage}
    \renewcommand{\headrulewidth}{0pt}}
    \pagestyle{fancy}
    \renewcommand{\chaptermark}[1]{\markboth{\ ##1}{}}
    \renewcommand{\sectionmark}[1]{\markright{\thesection\ ##1}}
    \ifthenelse{\boolean{@printversion}}{%
      \fancyhead{}
      \fancyhead[LE, RO]{\sf \thepage}
      \fancyhead[RE]{\sf \leftmark}
      \fancyhead[LO]{\sf \rightmark}
      }
      {%
      \fancyhead{}
      \fancyhead[RO, RE]{\sf \rightmark}
      \fancyhead[LO, LE]{\sf \thepage}
      }
    \fancyfoot{}
 
  \newcounter{oldpage}
  \setcounter{oldpage}{\value{page}}
  \pagenumbering{roman}
  \setcounter{page}{\value{oldpage}}
} %%% end frontmatter
  

%%% abstract
\newenvironment{abstract}[1][Abstract]{%
\chapter*{#1\markboth{#1}{}}
}


%%% acknowledgments
\newenvironment{acknowledgements}{%
\chapter*{Acknowledgements\markboth{Acknowledgements}{}}
}{\cleardoublepage}

\renewcommand\listfigurename{Figures}
\renewcommand\listtablename{Tables}





%%% put ToC, LoF, LoT and Index entries in the ToC
%%% use of \phantomsection is required for dealing with hyperref
%%% package and depends on nohyper option


\renewcommand\tableofcontents{%
\ifthenelse{\boolean{@hypermode}}{\phantomsection}{}
\addcontentsline{toc}{chapter}{\contentsname}%
    \chapter*{\contentsname
        \@mkboth{\contentsname}{\contentsname}}%
    \@starttoc{toc}%
\cleardoublepage
    }

\renewcommand\listoffigures{%
\ifthenelse{\boolean{@hypermode}}{\phantomsection}{}
\addcontentsline{toc}{chapter}{List of \listfigurename}%
    \chapter*{\listfigurename}%
      \@mkboth{\listfigurename}%
              {\listfigurename}%
    \@starttoc{lof}%
\cleardoublepage
    }

\renewcommand\listoftables{%
\ifthenelse{\boolean{@hypermode}}{\phantomsection}{}
\addcontentsline{toc}{chapter}{List of \listtablename}%
    \chapter*{\listtablename}%
      \@mkboth{%
          \listtablename}%
         {\listtablename}%
    \@starttoc{lot}%
    }

\renewenvironment{theindex}
               {\twocolumn[\@makeschapterhead{\indexname}]%
                \ifthenelse{\boolean{@hypermode}}{\phantomsection}{}
		\addcontentsline{toc}{chapter}{\indexname}
                \@mkboth{\indexname}%
                        {\indexname}%
                \thispagestyle{plain}\parindent\z@
                \parskip\z@ \@plus .3\p@\relax
                \columnseprule \z@
                \columnsep 35\p@
                \let\item\@idxitem}
               {}


%%% other useful packages

\RequirePackage{booktabs}
\RequirePackage{graphicx}
\RequirePackage{textcomp}
\RequirePackage{url}
\RequirePackage{amsmath}
%\RequirePackage[square]{natbib}
%%% lowercase header for bibliography and corresponding entry in the
%%% ToC. \bibsection is provided by the natbib package
%\renewcommand\bibsection{
%\chapter*{\bibname \@mkboth{\bibname}{\bibname}}
%\ifthenelse{\boolean{@hypermode}}{\phantomsection}{}
%\addcontentsline{toc}{chapter}{\bibname}
%}

%%% switch on hyperref support
\ifthenelse{\boolean{@hypermode}}{%
\RequirePackage[unicode,plainpages=false,pdfpagelabels,breaklinks]{hyperref}
\RequirePackage[all]{hypcap}
}{}

%%% other formatting stuff

\renewcommand{\baselinestretch}{1.05}
