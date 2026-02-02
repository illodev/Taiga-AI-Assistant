"use client";

import * as React from "react";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";

type MarkdownRendererProps = React.ComponentProps<typeof Streamdown>;

export default function Markdown(props: MarkdownRendererProps) {
  return (
    <Streamdown
      shikiTheme={["github-dark", "github-dark"]}
      mode="static"
      plugins={{ code, mermaid, math, cjk }}
      {...props}
    />
  );
}
