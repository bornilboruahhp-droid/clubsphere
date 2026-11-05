"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { INSTITUTION_TIMEZONE } from "@/lib/config";
import { ThemeToggle } from "@/components/layout/theme-toggle";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

const exampleFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  bio: z.string().max(160, "Bio cannot exceed 160 characters.").optional(),
  receiveUpdates: z.boolean(),
});

type ExampleFormValues = z.infer<typeof exampleFormSchema>;

export default function ExamplesPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const form = useForm<ExampleFormValues>({
    resolver: zodResolver(exampleFormSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      receiveUpdates: true,
    },
  });

  function onSubmit(data: ExampleFormValues) {
    toast.success("Form submitted successfully!", {
      description: `Name: ${data.fullName}, Updates: ${data.receiveUpdates ? "Yes" : "No"}`,
    });
  }

  const sampleDate = new Date();

  return (
    <div className="min-h-screen bg-base text-copy-primary p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-copy-primary">
              Design System & Component Showcase
            </h1>
            <p className="text-sm text-copy-secondary">
              Visual verification of shadcn primitives, tokens, and utilities in both light and dark modes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="default"
              onClick={() =>
                toast.info("Sonner Notification", {
                  description: `Current timezone is set to ${INSTITUTION_TIMEZONE}.`,
                })
              }
            >
              <Bell className="size-4" data-icon="inline-start" />
              Test Toast
            </Button>
          </div>
        </header>

        {/* Date Utilities Verification */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-copy-primary">
            1. Formatter Utilities & Timezone ({INSTITUTION_TIMEZONE})
          </h2>
          <Card className="border-surface-border bg-surface rounded-2xl">
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-copy-muted">formatDate()</span>
                <span className="text-sm font-mono text-copy-primary">
                  {formatDate(sampleDate)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-copy-muted">formatDateTime()</span>
                <span className="text-sm font-mono text-copy-primary">
                  {formatDateTime(sampleDate)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-copy-muted">formatRelative()</span>
                <span className="text-sm font-mono text-copy-primary">
                  {formatRelative(sampleDate)}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons & Badges */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-copy-primary">
            2. Buttons & Badges
          </h2>
          <Card className="border-surface-border bg-surface rounded-2xl">
            <CardHeader>
              <CardTitle>Interactive Variants</CardTitle>
              <CardDescription className="text-copy-secondary">
                Variants inherit brand, surface, and semantic state tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Default (Brand)</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="icon" aria-label="Icon Action">
                  <Sparkles className="size-4" />
                </Button>
              </div>
              <Separator className="bg-surface-border" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Default Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
                <Badge variant="destructive">Destructive Badge</Badge>
                <Badge className="bg-state-success-dim text-state-success border-transparent">
                  Success Dim
                </Badge>
                <Badge className="bg-state-warning-dim text-state-warning border-transparent">
                  Warning Dim
                </Badge>
                <Badge className="bg-state-info-dim text-state-info border-transparent">
                  Info Dim
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Overlays & Modals */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-copy-primary">
            3. Dialogs, Alerts, Sheets & Menus
          </h2>
          <Card className="border-surface-border bg-surface rounded-2xl">
            <CardContent className="pt-6 flex flex-wrap items-center gap-4">
              {/* Dialog */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-surface-border bg-surface">
                  <DialogHeader>
                    <DialogTitle>Standard Modal Dialog</DialogTitle>
                    <DialogDescription className="text-copy-secondary">
                      This is a centered dialog configured with a 3xl rounded corner radius.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-copy-secondary">
                      Dialog content rendered using semantic surface tokens.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* AlertDialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Open Confirm Dialog</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-surface-border bg-surface">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Destructive Action Confirmation</AlertDialogTitle>
                    <AlertDialogDescription className="text-copy-secondary">
                      Are you sure you want to proceed? This confirmation uses AlertDialog.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toast.error("Action executed")}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Sheet */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">Open Sheet Drawer</Button>
                </SheetTrigger>
                <SheetContent side="right" className="border-surface-border bg-surface">
                  <SheetHeader>
                    <SheetTitle>Sheet Panel</SheetTitle>
                    <SheetDescription className="text-copy-secondary">
                      Collapsible side drawer for responsive menus and overlays.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 flex flex-col gap-3">
                    <p className="text-sm text-copy-secondary">Drawer content goes here.</p>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Dropdown Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="border-surface-border bg-elevated">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => toast.info("Profile selected")}>
                      <User className="mr-2 size-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Schedule selected")}>
                      <Calendar className="mr-2 size-4" />
                      <span>Schedule</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Activity selected")}>
                      <Clock className="mr-2 size-4" />
                      <span>Activity Log</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </section>

        {/* Form Controls with react-hook-form & Zod */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-copy-primary">
            4. Form Controls & Validation
          </h2>
          <Card className="border-surface-border bg-surface rounded-2xl max-w-2xl">
            <CardHeader>
              <CardTitle>Member Registration</CardTitle>
              <CardDescription className="text-copy-secondary">
                Validated using React Hook Form, Zod schema, and shadcn inputs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Alex Johnson"
                            className="border-surface-border rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-copy-muted">
                          Official name as registered in the institution.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select defaultValue="cs">
                      <SelectTrigger id="department" className="border-surface-border rounded-xl">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent className="border-surface-border bg-elevated">
                        <SelectGroup>
                          <SelectItem value="cs">Computer Science & Engineering</SelectItem>
                          <SelectItem value="me">Mechanical Engineering</SelectItem>
                          <SelectItem value="ee">Electrical Engineering</SelectItem>
                          <SelectItem value="bt">Biotechnology</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio & Interests</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write a brief intro..."
                            className="border-surface-border rounded-xl resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="receiveUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="flex flex-col gap-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Receive notifications about upcoming elections
                          </FormLabel>
                          <FormDescription className="text-xs text-copy-muted">
                            You can modify your notification preferences at any time.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                    <Button type="submit">Submit Registration</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>

        {/* Data Display: Tabs, Table, Avatar, Skeleton */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-copy-primary">
            5. Tabs, Tables, Avatars & Skeletons
          </h2>
          <Card className="border-surface-border bg-surface rounded-2xl">
            <CardContent className="pt-6 flex flex-col gap-6">
              <Tabs defaultValue="roster" className="w-full">
                <TabsList className="bg-subtle p-1 rounded-xl">
                  <TabsTrigger value="roster">Club Roster</TabsTrigger>
                  <TabsTrigger value="loading">Loading State</TabsTrigger>
                </TabsList>
                <TabsContent value="roster" className="pt-4">
                  <Table className="border border-surface-border rounded-xl">
                    <TableHeader>
                      <TableRow className="border-surface-border hover:bg-subtle/50">
                        <TableHead className="text-copy-secondary">Member</TableHead>
                        <TableHead className="text-copy-secondary">Role</TableHead>
                        <TableHead className="text-copy-secondary">Status</TableHead>
                        <TableHead className="text-copy-secondary text-right">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-surface-border hover:bg-subtle/50">
                        <TableCell className="font-medium flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn" />
                            <AvatarFallback>SC</AvatarFallback>
                          </Avatar>
                          <span>Samira Chen</span>
                        </TableCell>
                        <TableCell>President</TableCell>
                        <TableCell>
                          <Badge className="bg-state-success-dim text-state-success border-transparent">
                            ACTIVE
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDate("2026-01-15")}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-surface-border hover:bg-subtle/50">
                        <TableCell className="font-medium flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback>RK</AvatarFallback>
                          </Avatar>
                          <span>Rohan Kapoor</span>
                        </TableCell>
                        <TableCell>Treasurer</TableCell>
                        <TableCell>
                          <Badge className="bg-state-warning-dim text-state-warning border-transparent">
                            PENDING
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDate("2026-02-01")}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="loading" className="pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-xl" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
