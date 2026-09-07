/// Mirror src/lib/constants/status.ts
enum VisitStatus {
  pending,
  inProgress,
  gagalPartial,
  completed,
  gagalTotal,
}

extension VisitStatusX on VisitStatus {
  String get value {
    switch (this) {
      case VisitStatus.pending:
        return 'pending';
      case VisitStatus.inProgress:
        return 'in_progress';
      case VisitStatus.gagalPartial:
        return 'gagal_partial';
      case VisitStatus.completed:
        return 'completed';
      case VisitStatus.gagalTotal:
        return 'gagal_total';
    }
  }

  String get label {
    switch (this) {
      case VisitStatus.pending:
        return 'Pending';
      case VisitStatus.inProgress:
        return 'In Progress';
      case VisitStatus.gagalPartial:
        return 'Gagal Partial';
      case VisitStatus.completed:
        return 'Completed';
      case VisitStatus.gagalTotal:
        return 'Gagal Total';
    }
  }

  static VisitStatus fromString(String s) {
    switch (s) {
      case 'pending':
        return VisitStatus.pending;
      case 'in_progress':
        return VisitStatus.inProgress;
      case 'gagal_partial':
        return VisitStatus.gagalPartial;
      case 'completed':
        return VisitStatus.completed;
      case 'gagal_total':
        return VisitStatus.gagalTotal;
      default:
        return VisitStatus.pending;
    }
  }
}

const scheduleStatuses = VisitStatus.values;

const statusTransitions = <VisitStatus, List<VisitStatus>>{
  VisitStatus.pending: [
    VisitStatus.inProgress,
    VisitStatus.gagalPartial,
    VisitStatus.completed,
    VisitStatus.gagalTotal,
  ],
  VisitStatus.inProgress: [
    VisitStatus.gagalPartial,
    VisitStatus.completed,
    VisitStatus.gagalTotal,
  ],
  VisitStatus.gagalPartial: [VisitStatus.completed, VisitStatus.gagalTotal],
  VisitStatus.completed: [VisitStatus.inProgress],
  VisitStatus.gagalTotal: [],
};

bool canTransition(VisitStatus from, VisitStatus to) {
  return statusTransitions[from]!.contains(to);
}
