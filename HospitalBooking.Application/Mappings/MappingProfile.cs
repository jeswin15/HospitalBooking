using AutoMapper;
using HospitalBooking.Application.DTOs;
using HospitalBooking.Domain.Entities;

namespace HospitalBooking.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Admin, UserSummaryDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            CreateMap<Doctor, UserSummaryDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => "Doctor"));

            CreateMap<Patient, UserSummaryDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => "Patient"));

            CreateMap<CreateDoctorRequestDto, Doctor>();
        }
    }
}
