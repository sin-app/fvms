import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fvms_flutter/core/supabase/client.dart';

class LandProposalLite { LandProposalLite({required this.id, required this.status, this.memberName, this.blockNo}); final String id;
final String status; final String? memberName;
final String? blockNo; }

abstract class LandProposalEvent extends Equatable { @override List<Object?> get props => []; }
class LandProposalsLoad extends LandProposalEvent {}

abstract class LandProposalState extends Equatable { @override List<Object?> get props => []; }
class LandProposalsInitial extends LandProposalState {}
class LandProposalsLoading extends LandProposalState {}
class LandProposalsLoaded extends LandProposalState { LandProposalsLoaded(this.items); final List<LandProposalLite> items; @override List<Object?> get props => [items]; }
class LandProposalsError extends LandProposalState { LandProposalsError(this.message); final String message; @override List<Object?> get props => [message]; }

class LandProposalBloc extends Bloc<LandProposalEvent, LandProposalState> {
  LandProposalBloc() : super(LandProposalsInitial()) {
    on<LandProposalsLoad>((e, emit) async {
      emit(LandProposalsLoading());
      if (!isSupabaseInitialized || !SupabaseConfig.isConfigured) {
        emit(LandProposalsError('Supabase belum siap'));
        return;
      }
      try {
        final ctx = await getAuthContext().timeout(const Duration(seconds: 8));
        dynamic query = supabase.from('land_proposals');
        if (ctx != null) {
          if (ctx.role == UserRole.produksi) {
            query = query.eq('proposed_by', ctx.userId);
          } else if (ctx.role == UserRole.qc) {
            final scope = qcKabupatenScope(ctx);
            if (scope != null) {
              if (scope.isEmpty) {
                query = query.eq('kabupaten_id', '__none__');
              } else {
                query = query.filter('kabupaten_id', 'in', '(${scope.map((e) => '"$e"').join(',')})');
              }
            }
          }
        }
        final rows = await query.select('id, status, member_name, block_no').order('created_at', ascending: false).limit(50).timeout(const Duration(seconds: 10));
        final items = (rows as List).map((r) {
          final m = r as Map<String, dynamic>;
          return LandProposalLite(id: m['id'] as String, status: m['status'] as String, memberName: m['member_name'] as String?, blockNo: m['block_no'] as String?);
        }).toList();
        emit(LandProposalsLoaded(items));
      } on TimeoutException {
        emit(LandProposalsError('Timeout pengajuan lahan: cek koneksi (10s)'));
      } catch (err) {
        final m = err.toString();
        if (m.contains('LateInitializationError') || m.contains('has not been initialized') || m.contains('not been initialized')) {
          emit(LandProposalsError('Supabase belum siap (LateInit): restart app'));
        } else {
          emit(LandProposalsError(m.replaceFirst('Exception: ', '')));
        }
      }
    });
  }
}
