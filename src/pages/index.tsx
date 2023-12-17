import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"

const IndexPage: React.FC<PageProps> = () => {
  return (
    <h1 className="text-green-600">Let's go</h1>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>
