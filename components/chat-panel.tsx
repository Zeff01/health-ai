import * as React from 'react'

import { shareChat } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { nanoid } from 'nanoid'
import { BotMessage, UserMessage } from './stocks/message'
import useStorage from '@/lib/hooks/use-storage'
import { fetchDataWithAbort } from '@/lib/utils'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const [aiState, setAiState] = useAIState<typeof AI>()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const { getItem, setItem } = useStorage()
  const [isStreaming, setIsStreaming] = React.useState(true)
  const hasRunEffect = React.useRef(false)

  const controller = React.useRef(new AbortController())
  const signal = React.useMemo(() => {
    return controller.current.signal
  }, [controller.current])

  const abortButtonHandler = () => {
    controller.current.abort()
    console.log('Fetch request manually aborted')
    // controller.current = new AbortController()
  }

  React.useEffect(() => {
    if (!isStreaming && hasRunEffect.current) {
      const threadId = getItem('chat_thread', 'session')
      setItem(
        'chat-thread-history',
        JSON.stringify({ threadId, messages: [...messages] }),
        'local'
      )
    }
    hasRunEffect.current = true
  }, [isStreaming])

  const exampleMessages = [
    {
      heading: 'Insurance Plans',
      subheading: 'What are the available health insurance plans in my area?',
      message: `What are the available health insurance plans in my area?`
    },
    {
      heading: 'Healthcare Providers',
      subheading: 'Who are the available healthcare providers near me?',
      message: 'Who are the available healthcare providers near me?'
    },
    {
      heading: 'Healthcare Options',
      subheading:
        'What healthcare options are available in the state of Texas?',
      message: `What health care options are available in the state of Texas?`
    },
    {
      heading: 'Drug Information',
      subheading: 'Can you tell me the information for a specific medication?',
      message: `Can you tell me the information for a specific medication?`
    }
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            exampleMessages.map((example, index) => (
              <div
                key={example.heading}
                className={`cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${
                  index > 1 && 'hidden md:block'
                }`}
                onClick={async () => {
                  if (aiState.isChatting) return
                  setAiState(prevState => ({ ...prevState, isChatting: true }))
                  setIsStreaming(true)
                  setMessages(currentMessages => [
                    ...currentMessages,
                    {
                      id: nanoid(),
                      display: example.message,
                      type: 'user'
                    }
                  ])

                  const nanoID = nanoid()

                  setMessages(currentMessages => [
                    ...currentMessages,
                    {
                      id: nanoID,
                      display: '',
                      type: 'bot',
                      status: true
                    }
                  ])

                  const thread = getItem('chat_thread')

                  const restructuredObject = {
                    sessionID: thread,
                    prompt: example.message
                  }
                  fetchDataWithAbort(
                    controller,
                    restructuredObject,
                    setMessages,
                    nanoID,
                    setIsStreaming,
                    setAiState
                  )
                }}
              >
                <div className="text-sm font-semibold">{example.heading}</div>
                <div className="text-sm text-zinc-600">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        {/* {messages?.length >= 2 ? (
          <div className="flex h-12 items-center justify-center">
            <div className="flex space-x-2">
              {id && title ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <IconShare className="mr-2" />
                    Share
                  </Button>
                  <ChatShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    onCopy={() => setShareDialogOpen(false)}
                    shareChat={shareChat}
                    chat={{
                      id,
                      title,
                      messages: aiState.messages
                    }}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null} */}

        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            input={input}
            setInput={setInput}
            signal={signal}
            controller={controller}
            abortButtonHandler={abortButtonHandler}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
          />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
