import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/supabase/client.dart';

class LandProposalLite { final String id, status; final String? memberName, blockNo; LandProposalLite({required this.id, required this.status, this.memberName, this.blockNo}); }

abstract class LandProposalEvent extends Equatable { @override List<Object?> get props => []; }
class LandProposalsLoad extends LandProposalEvent {}

abstract class LandProposalState extends Equatable { @override List<Object?> get props => []; }
class LandProposalsInitial extends LandProposalState {}
class LandProposalsLoading extends LandProposalState {}
class LandProposalsLoaded extends LandProposalState { final List<LandProposalLite> items; LandProposalsLoaded(this.items); @override List<Object?> get props => [items]; }
class LandProposalsError extends LandProposalState { final String message; LandProposalsError(this.message); @override List<Object?> get props => [message]; }

class LandProposalBloc extends Bloc<LandProposalEvent, LandProposalState> {
  LandProposalBloc() : super(LandProposalsInitial()) {
    on<LandProposalsLoad>((e, emit) async {
      emit(LandProposalsLoading());
      try {
        final rows = await supabase.from('land_proposals').select('id, status, member_name, block_no').order('created_at', ascending: false).limit(50);
        final items = (rows as List).map((r) => LandProposalLite(id: r['id'], status: r['status'], memberName: r['member_name'], blockNo: r['block_no'])).toList();
        emit(LandProposalsLoaded(items));
      } catch (err) { emit(LandProposalsError(err.toString())); }
    });
  }
}
