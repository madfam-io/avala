import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";

describe("Dialog", () => {
  it("renders trigger button", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText("Open Dialog")).toBeInTheDocument();
  });

  it("opens dialog on trigger click", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog content here</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });

  it("renders dialog content", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders dialog footer", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Dialog</DialogTitle>
          <DialogFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });
});
