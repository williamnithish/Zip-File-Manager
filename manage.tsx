import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListPatients,
  useCreatePatient,
  useListDoctors,
  useCreateDoctor,
  useGetPatientContext,
  useGetDoctorContext,
  getListPatientsQueryKey,
  getListDoctorsQueryKey,
  Patient,
  Doctor,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  User, UserPlus, Stethoscope, Plus, Calendar, Building2, Mail,
  Loader2, Search, Network, ShieldAlert, CheckSquare, AlertTriangle, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const DEPARTMENTS = ["cardio", "ortho", "general", "neuro", "onco", "peds", "emergency", "radiology", "surgery", "other"];
const SPECIALTIES = ["Cardiology", "Orthopedics", "General Practice", "Neurology", "Oncology", "Pediatrics", "Emergency Medicine", "Radiology", "Surgery", "Psychiatry", "Other"];

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mrn: z.string().min(1, "MRN is required"),
  dateOfBirth: z.string().optional(),
  department: z.string().optional(),
});

const doctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  specialty: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

function typeIcon(type: string) {
  if (type === "CONSTRAINT") return <ShieldAlert className="h-3 w-3 text-red-500" />;
  if (type === "DECISION") return <CheckSquare className="h-3 w-3 text-primary" />;
  if (type === "ANTI_PATTERN") return <AlertTriangle className="h-3 w-3 text-orange-500" />;
  return <Info className="h-3 w-3 text-blue-500" />;
}

function PatientDetailSheet({ patient, open, onClose }: { patient: Patient; open: boolean; onClose: () => void }) {
  const { data: ctx, isLoading } = useGetPatientContext(patient.id);

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {patient.name}
          </SheetTitle>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-mono">{patient.mrn}</p>
            {patient.department && <p className="capitalize">{patient.department} · {patient.dateOfBirth ?? "DOB unknown"}</p>}
          </div>
        </SheetHeader>
        <Separator className="mb-4" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Knowledge Nodes {ctx ? `(${ctx.knowledgeNodes.length})` : ""}
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : ctx?.knowledgeNodes.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <Network className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No knowledge nodes captured yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ctx?.knowledgeNodes.map(n => (
              <div key={n.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  {typeIcon(n.type)}
                  <span className="text-xs font-medium">{n.title}</span>
                  <Badge variant={n.status === "ACTIVE" ? "default" : "secondary"} className="ml-auto text-[10px] h-4">{n.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                <p className="text-[10px] text-muted-foreground">{(n.confidence * 100).toFixed(0)}% conf · {n.department ?? "general"}</p>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DoctorDetailSheet({ doctor, open, onClose }: { doctor: Doctor; open: boolean; onClose: () => void }) {
  const { data: ctx, isLoading } = useGetDoctorContext(doctor.id);

  const stats = useMemo(() => {
    if (!ctx) return null;
    const total = ctx.knowledgeNodes.length;
    const active = ctx.knowledgeNodes.filter(n => n.status === "ACTIVE").length;
    const avgConf = total > 0 ? ctx.knowledgeNodes.reduce((s, n) => s + n.confidence, 0) / total : 0;
    return { total, active, avgConf };
  }, [ctx]);

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" /> {doctor.name}
          </SheetTitle>
          <div className="space-y-1 text-sm text-muted-foreground">
            {doctor.specialty && <p>{doctor.specialty}</p>}
            {doctor.email && <p>{doctor.email}</p>}
          </div>
        </SheetHeader>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-muted/40 rounded-lg">
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total Nodes</p>
            </div>
            <div className="text-center p-2 bg-muted/40 rounded-lg">
              <p className="text-lg font-bold text-primary">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-2 bg-muted/40 rounded-lg">
              <p className="text-lg font-bold">{(stats.avgConf * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">Avg Conf</p>
            </div>
          </div>
        )}

        <Separator className="mb-4" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Contributed Nodes
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : ctx?.knowledgeNodes.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <Network className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No knowledge nodes contributed yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ctx?.knowledgeNodes.map(n => (
              <div key={n.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  {typeIcon(n.type)}
                  <span className="text-xs font-medium">{n.title}</span>
                  <Badge variant={n.status === "ACTIVE" ? "default" : "secondary"} className="ml-auto text-[10px] h-4">{n.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                <p className="text-[10px] text-muted-foreground">{(n.confidence * 100).toFixed(0)}% conf · Patient #{n.patientId ?? "—"}</p>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function Manage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  const { data: patients, isLoading: loadingPatients } = useListPatients();
  const { data: doctors, isLoading: loadingDoctors } = useListDoctors();
  const createPatient = useCreatePatient();
  const createDoctor = useCreateDoctor();

  const filteredPatients = useMemo(
    () => patients?.filter(p => !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.mrn.toLowerCase().includes(patientSearch.toLowerCase())),
    [patients, patientSearch]
  );

  const filteredDoctors = useMemo(
    () => doctors?.filter(d => !doctorSearch || d.name.toLowerCase().includes(doctorSearch.toLowerCase()) || (d.specialty ?? "").toLowerCase().includes(doctorSearch.toLowerCase())),
    [doctors, doctorSearch]
  );

  const patientForm = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", mrn: "", dateOfBirth: "", department: "" },
  });

  const doctorForm = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { name: "", specialty: "", email: "" },
  });

  const onCreatePatient = async (values: z.infer<typeof patientSchema>) => {
    try {
      await createPatient.mutateAsync({
        data: {
          name: values.name,
          mrn: values.mrn,
          dateOfBirth: values.dateOfBirth || null,
          department: values.department || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
      toast({ title: "Patient created", description: values.name });
      patientForm.reset();
      setPatientDialogOpen(false);
    } catch {
      toast({ title: "Failed to create patient", variant: "destructive" });
    }
  };

  const onCreateDoctor = async (values: z.infer<typeof doctorSchema>) => {
    try {
      await createDoctor.mutateAsync({
        data: {
          name: values.name,
          specialty: values.specialty || null,
          email: values.email || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
      toast({ title: "Doctor created", description: values.name });
      doctorForm.reset();
      setDoctorDialogOpen(false);
    } catch {
      toast({ title: "Failed to create doctor", variant: "destructive" });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage</h1>
        <p className="text-muted-foreground mt-1">Add and view patients and clinical staff. Click any card to see their knowledge nodes.</p>
      </div>

      {/* Patients section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Patients</h2>
            <Badge variant="secondary" className="ml-1">{patients?.length ?? 0}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-testid="input-search-patients"
                placeholder="Search patients..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                className="pl-8 h-8 w-[180px] text-sm"
              />
            </div>
            <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-patient" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> New Patient
                  </DialogTitle>
                </DialogHeader>
                <Form {...patientForm}>
                  <form onSubmit={patientForm.handleSubmit(onCreatePatient)} className="space-y-4 pt-2">
                    <FormField
                      control={patientForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input data-testid="input-patient-name" placeholder="Eleanor Vasquez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientForm.control}
                      name="mrn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MRN</FormLabel>
                          <FormControl>
                            <Input data-testid="input-patient-mrn" placeholder="MRN-10042" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={patientForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input data-testid="input-patient-dob" type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-patient-dept">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DEPARTMENTS.map(d => (
                                  <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button data-testid="button-submit-patient" type="submit" className="w-full" disabled={createPatient.isPending}>
                      {createPatient.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Patient"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loadingPatients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filteredPatients?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border border-dashed rounded-xl bg-muted/20 space-y-3">
            <User className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{patientSearch ? "No patients match your search." : "No patients yet"}</p>
            {!patientSearch && <Button size="sm" onClick={() => setPatientDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add first patient</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients?.map(patient => (
              <Card
                key={patient.id}
                data-testid={`patient-card-${patient.id}`}
                className="hover:shadow-md transition-all cursor-pointer hover:border-primary/40"
                onClick={() => setSelectedPatient(patient)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    {patient.department && (
                      <Badge variant="outline" className="text-xs capitalize">{patient.department}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{patient.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{patient.mrn}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                  {patient.dateOfBirth && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>DOB: {patient.dateOfBirth}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>Added {patient.createdAt ? format(new Date(patient.createdAt), "MMM d, yyyy") : "—"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Doctors section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Clinical Staff</h2>
            <Badge variant="secondary" className="ml-1">{doctors?.length ?? 0}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-testid="input-search-doctors"
                placeholder="Search doctors..."
                value={doctorSearch}
                onChange={e => setDoctorSearch(e.target.value)}
                className="pl-8 h-8 w-[180px] text-sm"
              />
            </div>
            <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-doctor" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" /> New Doctor
                  </DialogTitle>
                </DialogHeader>
                <Form {...doctorForm}>
                  <form onSubmit={doctorForm.handleSubmit(onCreateDoctor)} className="space-y-4 pt-2">
                    <FormField
                      control={doctorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input data-testid="input-doctor-name" placeholder="Dr. Sarah Mitchell" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={doctorForm.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialty</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-doctor-specialty">
                                <SelectValue placeholder="Select specialty..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SPECIALTIES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={doctorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input data-testid="input-doctor-email" type="email" placeholder="doctor@hospital.org" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button data-testid="button-submit-doctor" type="submit" className="w-full" disabled={createDoctor.isPending}>
                      {createDoctor.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Doctor"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loadingDoctors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filteredDoctors?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border border-dashed rounded-xl bg-muted/20 space-y-3">
            <Stethoscope className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{doctorSearch ? "No doctors match your search." : "No doctors yet"}</p>
            {!doctorSearch && <Button size="sm" onClick={() => setDoctorDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add first doctor</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors?.map(doctor => (
              <Card
                key={doctor.id}
                data-testid={`doctor-card-${doctor.id}`}
                className="hover:shadow-md transition-all cursor-pointer hover:border-teal-400/60"
                onClick={() => setSelectedDoctor(doctor)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-4 w-4 text-teal-600" />
                    </div>
                    {doctor.specialty && (
                      <Badge variant="outline" className="text-xs">{doctor.specialty}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2">{doctor.name}</CardTitle>
                  {doctor.email && (
                    <CardDescription className="text-xs">{doctor.email}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>Added {doctor.createdAt ? format(new Date(doctor.createdAt), "MMM d, yyyy") : "—"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Patient detail sheet */}
      {selectedPatient && (
        <PatientDetailSheet
          patient={selectedPatient}
          open={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {/* Doctor detail sheet */}
      {selectedDoctor && (
        <DoctorDetailSheet
          doctor={selectedDoctor}
          open={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
}
