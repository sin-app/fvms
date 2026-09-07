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
        final items = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return LandProposalLite(id: m['id'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?);
        }).toList();
        emit(LandProposalsLoaded(items));
      } catch (err) { emit(LandProposalsError(err.toString())); }
    });
  }
}
