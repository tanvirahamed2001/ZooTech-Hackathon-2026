# Tmux + phone workflow (from a friend’s post)

A friend shared how they run coding agents from their phone and get notified when the agent is done or needs input — so they don’t have to hover at the computer. Summary below, then how we can use this for **Varkly**.

---

## The post (summary)

- Running agents was fun and productive, but having to “hover” at the computer to watch status was a drag.
- With family and limited evening/weekend time, they wanted to prompt from the phone and get notified when done or when input was needed.
- They set it up and found it a big unlock: ~30 seconds on the phone to send the agent on a task, then a notification when it’s done or needs a reply.

**Steps they use:**

1. On the computer, start the agent in a **tmux** session instead of a normal terminal: `tmux new -As <your-session-name>`.
2. Run the coding agent inside that tmux session.
3. On the Mac: **System Settings → General → Sharing → Remote Login** (enable SSH).
4. Install **Tailscale** on computer and phone; get the computer’s Tailscale hostname/IP.
5. On the phone, install **Termius** and add an SSH connection: Host = Tailscale IP/hostname, Username = Mac user, Password or Key = usual sign-in, Port = 22.
6. From the phone: open Termius, SSH in: `ssh <user>@<host>`.
7. To reconnect to the same session later: `tmux attach -t <session-name>`, or `tmux ls` to see session names.
8. The agent uses **ntfy** to send push notifications to the phone when it’s done or needs input again.

---

## Applying this to Varkly

### As a Varkly developer

You can use the same workflow to work on Varkly without staying at your desk:

- **Session name:** e.g. `tmux new -As varkly`.
- **Dev server in tmux:** Run `npm run dev` (and optionally `npm run serve-models`) inside that session. The app keeps running when you disconnect. From your phone you can open the app in the browser via your Mac’s Tailscale URL (e.g. `http://<tailscale-hostname>:5173`) if you’re on the same Tailscale network.
- **Agent in tmux:** Run your coding agent (e.g. Cursor’s agent, or any CLI agent) in the same or another tmux window. When the agent supports ntfy (or you wrap it), you get notified on your phone when it’s done or needs input.
- **Reconnect:** From Termius, `ssh user@host`, then `tmux attach -t varkly` (or `tmux ls` then attach). No need to stay at the machine while the agent or dev server runs.

This fits the “don’t hover — prompt from your phone and get notified” idea for side-project work on Varkly.

### As a product idea for quiz-takers

The same idea — *get notified when something’s done so you don’t have to hover* — can apply to **people taking the Varkly quiz**:

- **“Notify me when my results are ready”**  
  When a user finishes the voice or text quiz, we could ask for **browser notification permission** and, if granted, send a Web Notification when the results view is ready (e.g. “Your VARK results are ready”). They can step away, get a ping on their device, and come back to view the results. Implementation: use the [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) after quiz completion; no backend required, since results are in the client and shareable via URL.

This would be an optional, user-consent flow that mirrors the developer workflow: do a task (take the quiz), get notified when it’s done, instead of waiting on the screen.
